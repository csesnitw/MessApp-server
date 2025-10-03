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
    if (!admin) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin._id, role: admin.role, messName: admin.messName },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
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



router.post("/menu", async (req, res) => {
  try {
    const weekMenu = req.body; // array of 7 days
    if (!Array.isArray(weekMenu) || weekMenu.length !== 7)
      return res.status(400).json({ message: "Provide 7 days menu" });

    //clear existing menu
    await Menu.deleteMany({});
    const createdMenu = await Menu.insertMany(weekMenu);
    res.json({ message: "Week menu added", data: createdMenu });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

//Update / Override Single Day
router.put("/menu/update/:day", async (req, res) => {
  try {
    const dayOfWeek = req.params.day;
    const { breakfast, lunch, dinner } = req.body;

    let updatedDay = await UpdatedMenu.findOne({ dayOfWeek });

    if (updatedDay) {
      updatedDay.breakfast = breakfast || updatedDay.breakfast;
      updatedDay.lunch = lunch || updatedDay.lunch;
      updatedDay.dinner = dinner || updatedDay.dinner;
      updatedDay.updatedAt = Date.now();
      await updatedDay.save();
    } else {
      updatedDay = new UpdatedMenu({ dayOfWeek, breakfast, lunch, dinner });
      await updatedDay.save();
    }

    res.json({ message: `Menu for ${dayOfWeek} updated`, data: updatedDay });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update / Override Whole Week
router.put("/menu/update-week", async (req, res) => {
  try {
    const weekUpdates = req.body; // array of 7 day objects

    if (!Array.isArray(weekUpdates) || weekUpdates.length !== 7)
      return res.status(400).json({ message: "Provide 7 days menu" });

    const updatedDays = [];
    for (let day of weekUpdates) {
      const { dayOfWeek, breakfast, lunch, dinner } = day;

      let updatedDay = await UpdatedMenu.findOne({ dayOfWeek });
      if (updatedDay) {
        updatedDay.breakfast = breakfast || updatedDay.breakfast;
        updatedDay.lunch = lunch || updatedDay.lunch;
        updatedDay.dinner = dinner || updatedDay.dinner;
        updatedDay.updatedAt = Date.now();
        await updatedDay.save();
      } else {
        updatedDay = new UpdatedMenu({ dayOfWeek, breakfast, lunch, dinner });
        await updatedDay.save();
      }
      updatedDays.push(updatedDay);
    }

    res.json({ message: "Week updated successfully", data: updatedDays });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

//Delete Override for a Day
router.delete("/menu/update/:day", async (req, res) => {
  try {
    const dayOfWeek = req.params.day;
    const deleted = await UpdatedMenu.findOneAndDelete({ dayOfWeek });
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
