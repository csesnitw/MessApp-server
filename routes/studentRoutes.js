const express = require("express");
const router = express.Router();
const { OAuth2Client } = require("google-auth-library");
const Student = require("../models/Student");
const Menu = require("../models/menu");
const UpdatedMenu = require("../models/updatedMenu");

// Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --------------------
// Helper: Verify Google Token
// --------------------
async function verifyGoogleToken(authHeader, res) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authorization header missing or invalid" });
    return null;
  }

  const token = authHeader.split(" ")[1];
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
  } catch (err) {
    res.status(401).json({ message: "Invalid Google token", error: err.message });
    return null;
  }
}

// --------------------
// Check if admin initialized students
// --------------------
router.get("/check-init", async (req, res) => {
  try {
    const studentCount = await Student.countDocuments();
    res.json({ initialized: studentCount > 0 });
  } catch (err) {
    res.status(500).json({ message: "Failed to check initialization", error: err.message });
  }
});

// --------------------
// Student login (Google OAuth)
// --------------------
router.post("/login", async (req, res) => {
  try {
    const { tokenId } = req.body;
    if (!tokenId) return res.status(400).json({ message: "tokenId is required" });

    const ticket = await client.verifyIdToken({ idToken: tokenId, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();

    if (!payload.email.endsWith("@student.nitw.ac.in")) {
      return res.status(400).json({ message: "Only @student.nitw.ac.in emails are allowed" });
    }

    const rollNo = payload.email.split("@")[0].substring(2);
    const student = await Student.findOne({ rollNo }).lean();
    if (!student) return res.status(404).json({ message: "Student not found. Contact admin." });

    res.json({
      message: "Login successful",
      student: {
        name: student.name || payload.name,
        email: payload.email,
        photoUrl: student.photoUrl || payload.picture || "",
        hasUploadedPhoto: student.hasUploadedPhoto || false,
        specialToken: student.specialToken || { active: false, redeemed: false },
        mess: student.mess || "",
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

// --------------------
// Upload student photo
// --------------------
router.post("/upload-photo", async (req, res) => {
  try {
    const { email, photoBase64 } = req.body;
    if (!email || !photoBase64) return res.status(400).json({ message: "Email and photoBase64 required" });

    const payload = await verifyGoogleToken(req.headers.authorization, res);
    if (!payload) return;

    const rollNo = payload.email.split("@")[0].substring(2);
    const student = await Student.findOne({ rollNo });
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.photoUrl = photoBase64;
    student.hasUploadedPhoto = true;
    await student.save();

    res.json({
      message: "Photo uploaded successfully",
      student: {
        name: student.name,
        email: payload.email,
        photoUrl: student.photoUrl,
        hasUploadedPhoto: student.hasUploadedPhoto,
        specialToken: student.specialToken,
        mess: student.mess,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Photo upload failed", error: err.message });
  }
});

// --------------------
// Fetch student details
// --------------------
router.get("/details", async (req, res) => {
  try {
    const payload = await verifyGoogleToken(req.headers.authorization, res);
    if (!payload) return;

    const rollNo = payload.email.split("@")[0].substring(2);
    const student = await Student.findOne({ rollNo });
    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json({
      message: "Student details fetched",
      student: {
        name: student.name || payload.name,
        rollNo: student.rollNo,
        email: payload.email,
        photoUrl: student.photoUrl || payload.picture || "",
        hasUploadedPhoto: student.hasUploadedPhoto,
        specialToken: student.specialToken,
        mess: student.mess || "",
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch student details", error: err.message });
  }
});

// --------------------
// Sync token (student side)
// --------------------
router.post("/sync-token", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const payload = await verifyGoogleToken(req.headers.authorization, res);
    if (!payload) return;

    if (payload.email !== email) return res.status(403).json({ message: "Email mismatch" });

    const rollNo = payload.email.split("@")[0].substring(2);
    const student = await Student.findOne({ rollNo });
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (student.specialToken.active) {
      student.specialToken.active = false;
      student.specialToken.redeemed = true;
      await student.save();
    }

    res.json({ message: "Token synced successfully", specialToken: student.specialToken });
  } catch (err) {
    res.status(500).json({ message: "Failed to sync token", error: err.message });
  }
});


// Fetch today's menu
router.get("/menu", async (req, res) => {
  try {
    const payload = await verifyGoogleToken(req.headers.authorization, res);
    if (!payload) return;

    const studentRollNo = payload.email.split("@")[0].substring(2);
    const student = await Student.findOne({ rollNo: studentRollNo }).lean();
    if (!student) return res.status(404).json({ message: "Student not found" });

    const mess = student.mess; 

    const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const today = days[new Date().getDay()];

    // Check override for this mess
    let menu= await Menu.findOne({ dayOfWeek: today, messName: mess }).lean();

    res.json(menu || { dayOfWeek: today, breakfast: [], lunch: [], dinner: [] });

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch menu", error: err.message });
  }
});


module.exports = router;
