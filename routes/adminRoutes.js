const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const Menu = require("../models/menu"); // usual week menu
const UpdatedMenu = require("../models/updatedMenu"); // overrides
const { verifyAdmin } = require("../middleware/adminAuth"); 

const Admin = require("../models/admin");
const Student = require("../models/Student");

const router = express.Router();
const upload = multer({ dest: "uploads/" });


const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Expect: Bearer <token>
  if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = verified; // attach admin data to req
    next();
  } catch (err) {
    return res.status(400).json({ message: "Invalid token" });
  }
};


// Admin Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(400).json({ message: "Invalid credentials1" });
    console.log(username);
    console.log(password);
    console.log(admin.password);
    const isMatch = (password==admin.password);//await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials2" });

    const token = jwt.sign(
      { id: admin._id, role: admin.role, messName: admin.messName },
      process.env.JWT_SECRET,
      { expiresIn: "10h" }
    );

    res.json({
      token,
      role: admin.role,
      messName: admin.messName,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Upload CSV 
router.post("/upload-csv", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    console.log("hi");
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        results.push({
          ...row,
          specialToken: { active: false, redeemed: false },
        });
      })
      .on("end", async () => {
        try {
          await Student.insertMany(results, { ordered: false }); // 
          fs.unlinkSync(req.file.path); // cleanup
          res.status(200).json({ message: "CSV uploaded successfully", count: results.length });
        } catch (err) {
          res.status(500).json({ error: err.message });
        }
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear students of a specific mess 
router.delete("/students/clear", verifyAdmin, async (req, res) => {
  try {
    const adminMess = req.user.messName; 
    console.log("Admin Mess Name:", adminMess);  

    const result = await Student.deleteMany({ mess: adminMess });
    console.log("Delete result:", result);     

    res.json({
      message: `All students from ${adminMess} cleared successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ message: "Error clearing students", error: err.message });
  }
});



//Add / Update Week Menu
router.put("/menu/upload-week-csv", verifyAdmin, upload.single("file"), async (req, res) => {
  try {
    const messName = req.user.messName;

    if (!req.file) return res.status(400).json({ message: "No CSV file uploaded" });

    const results = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        // Expect CSV columns: dayOfWeek, breakfast, lunch, dinner
        // Meals can be comma-separated in CSV
        results.push({
          dayOfWeek: row.dayOfWeek,
          breakfast: row.breakfast ? row.breakfast.split(",").map(m => m.trim()) : [],
          lunch: row.lunch ? row.lunch.split(",").map(m => m.trim()) : [],
          dinner: row.dinner ? row.dinner.split(",").map(m => m.trim()) : [],
          messName
        });
      })
      .on("end", async () => {
        try {
          const updatedDays = [];

          for (let day of results) {
            const { dayOfWeek, breakfast, lunch, dinner } = day;

            let menuDay = await Menu.findOne({ dayOfWeek, messName });
            if (menuDay) {
              menuDay.breakfast = breakfast;
              menuDay.lunch = lunch;
              menuDay.dinner = dinner;
              menuDay.updatedAt = Date.now();
              await menuDay.save();
            } else {
              menuDay = new Menu({ dayOfWeek, breakfast, lunch, dinner, messName });
              await menuDay.save();
            }

            updatedDays.push(menuDay);
          }

          fs.unlinkSync(req.file.path); // clean up temp file
          res.json({ message: "Week menu uploaded successfully", data: updatedDays });
        } catch (err) {
          res.status(500).json({ message: "Failed to save menu", error: err.message });
        }
      });

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ================= Override Single Day =================
router.put("/menu/update/:day", verifyAdmin, async (req, res) => {
  try {
    const dayOfWeek = req.params.day;
    const { breakfast, lunch, dinner } = req.body;
    const messName = req.user.messName;

    let updatedDay = await Menu.findOne({ dayOfWeek, messName });
    console.log(dayOfWeek);
    console.log(messName);
    if (updatedDay) {
      updatedDay.breakfast = breakfast || updatedDay.breakfast;
      updatedDay.lunch = lunch || updatedDay.lunch;
      updatedDay.dinner = dinner || updatedDay.dinner;
      updatedDay.updatedAt = Date.now();
      await updatedDay.save();
    } else {
      updatedDay = new Menu({ dayOfWeek, breakfast, lunch, dinner, messName });
      await updatedDay.save();
    }

    res.json({ message: `Override for ${dayOfWeek} set successfully`, data: updatedDay });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ================= Delete Override for a Day =================
router.delete("/menu/update/:day", verifyAdmin, async (req, res) => {
  try {
    const dayOfWeek = req.params.day;
    const messName = req.user.messName;
    console.log(dayOfWeek);
    console.log(messName);
    const deleted = await UpdatedMenu.findOneAndDelete({ dayOfWeek, messName });
    if (!deleted) return res.status(404).json({ message: "No override found" });

    res.json({ message: `Override for ${dayOfWeek} deleted`, data: deleted });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});




router.post("/special-dinner/redeem", verifyAdmin, async (req, res) => {
  try {
    // Admin's mess from verified token
    const adminMess = req.user.messName;

    // Find all students in this mess
    const students = await Student.find({ mess: adminMess });

     if (!students.length)
      return res.status(404).json({
        message: "No students found in your mess",
        mess: adminMess,  
      });

    // Redeem tokens
    for (let student of students) {
      student.specialToken.active = true;   // Green in frontend
      student.specialToken.redeemed = false; 
      await student.save();
    }

    res.json({
      message: `Special tokens redeemed for ${students.length} students in ${adminMess}`,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to redeem special tokens", error: err.message });
  }
});


module.exports = router;
