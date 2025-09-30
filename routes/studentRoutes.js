const express = require("express");
const router = express.Router();
const { OAuth2Client } = require("google-auth-library");
const Student = require("../models/Student");
const Menu = require("../models/Menu");

// Google OAuth client - Make sure GOOGLE_CLIENT_ID is set in environment
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Debug middleware to log requests
router.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Check if admin has initialized Excel
router.get("/check-init", async (req, res) => {
  try {
    const studentCount = await Student.countDocuments();
    console.log(`Student count: ${studentCount}`);
    res.json({ initialized: studentCount > 0 });
  } catch (err) {
    console.error("Check init error:", err);
    res.status(500).json({
      message: "Failed to check initialization",
      error: err.message,
    });
  }
});

// Student login using Google OAuth
router.post("/login", async (req, res) => {
  try {
    console.log("Login request received:", req.body);

    const { tokenId } = req.body;
    if (!tokenId) {
      console.log("No tokenId provided");
      return res.status(400).json({ message: "tokenId is required" });
    }

    console.log("Verifying Google ID token...");

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: tokenId,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return res.status(401).json({
        message: "Invalid Google token",
        error: verifyError.message,
      });
    }

    const payload = ticket.getPayload();
    console.log("Token verified for email:", payload.email);

    if (!payload.email.endsWith("@student.nitw.ac.in")) {
      console.log("Invalid email domain:", payload.email);
      return res.status(400).json({
        message: "Only @student.nitw.ac.in emails are allowed",
      });
    }

    console.log("Looking up student in database...");
    const student = await Student.findOne({ email: payload.email }).lean();
    if (!student) {
      console.log("Student not found in database:", payload.email);
      return res.status(404).json({
        message: "Student not found in the system. Please contact admin.",
      });
    }

    console.log("Login successful for:", payload.email);

    res.json({
      message: "Login successful",
      student: {
        name: student.name || payload.name,
        email: student.email,
        photoUrl: student.photoUrl || payload.picture || "",
        hasUploadedPhoto: student.hasUploadedPhoto || false,
        redeemedToken: student.redeemedToken || null,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
});

// Student uploads photo
router.post("/upload-photo", async (req, res) => {
  try {
    const { email, photoBase64 } = req.body;

    if (!email || !photoBase64) {
      return res.status(400).json({ message: "Email and photoBase64 are required" });
    }

    console.log("Photo upload request for:", email);
    console.log("Verifying Google ID token...");
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization header missing or invalid" });
    }

    const tokenIds = authHeader.split(" ")[1];

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: tokenIds,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return res.status(401).json({
        message: "Invalid Google token",
        error: verifyError.message,
      });
    }

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }


    student.photoUrl = photoBase64;
    student.hasUploadedPhoto = true;
    await student.save();

    console.log("Photo uploaded successfully for:", email);

    res.json({
      message: "Photo uploaded successfully",
      student: {
        name: student.name,
        email: student.email,
        photoUrl: student.photoUrl,
        hasUploadedPhoto: student.hasUploadedPhoto,
        redeemedToken: student.redeemedToken || null,
      },
    });
  } catch (err) {
    console.error("Photo upload error:", err);
    res.status(500).json({ message: "Failed to upload photo", error: err.message });
  }
});

// Fetch full student details
router.get("/details", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization header missing or invalid" });
    }

    const tokenId = authHeader.split(" ")[1];

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: tokenId,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return res.status(401).json({
        message: "Invalid Google token",
        error: verifyError.message,
      });
    }

    const payload = ticket.getPayload();
    const email = payload.email;

    const student = await Student.findOne({ email });
    if (!student) {
      console.log("Student not found:", email);
      return res.status(404).json({ message: "Student not found" });
    }

    return res.json({
      message: "Student details fetched successfully",
      student: {
        name: student.name || payload.name || "",
        email: student.email,
        rollNo:student.rollNo||"",
        photoUrl: student.photoUrl || payload.picture || "",
        hasUploadedPhoto: !!student.hasUploadedPhoto,
        redeemedToken: !!student.redeemedToken,
        mess:student.mess||"Z"
      },
    });
  } catch (err) {
    console.error("Student details fetch error:", err);
    return res.status(500).json({
      message: "Failed to fetch student details",
      error: err.message,
    });
  }
});



// Sync token from student device
router.post("/sync-token", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization header missing or invalid" });
    }

    const tokenId = authHeader.split(" ")[1];

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: tokenId,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return res.status(401).json({
        message: "Invalid Google token",
        error: verifyError.message,
      });
    }

    const payload = ticket.getPayload();
    const emailFromToken = payload.email;

    const { email, redeemedToken } = req.body;
    if (!email || redeemedToken === undefined) {
      return res.status(400).json({ message: "Email and redeemedToken are required" });
    }

    if (email !== emailFromToken) {
      return res.status(403).json({ message: "Email mismatch with token" });
    }

    console.log("Token sync request for:", email, "Token:", redeemedToken);

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.redeemedToken = redeemedToken;
    await student.save();

    console.log("Token synced successfully for:", email);
    res.json({ message: "Token synced successfully" });
  } catch (err) {
    console.error("Token sync error:", err);
    res.status(500).json({ message: "Failed to sync token", error: err.message });
  }
});

router.get("/menu", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization header missing or invalid" });
    }

    const tokenId = authHeader.split(" ")[1];

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: tokenId,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return res.status(401).json({
        message: "Invalid Google token",
        error: verifyError.message,
      });
    }

    const payload = ticket.getPayload();
    console.log("Fetching menu for student:", payload.email);

    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    console.log("Fetching menu for:", today);

    const menu = await Menu.findOne({ dayOfWeek: today }).lean();
    res.json(
      menu || { dayOfWeek: today, breakfast: [], lunch: [], dinner: [] }
    );
  } catch (err) {
    console.error("Menu fetch error:", err);
    res.status(500).json({ message: "Failed to fetch menu", error: err.message });
  }
});


module.exports = router;
