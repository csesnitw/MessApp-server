const express = require("express");
const router = express.Router();
const XLSX = require("xlsx");
const fs = require("fs");
const Student = require("../models/Student");
const Menu = require("../models/Menu");

// Admin uploads Excel to initialize students
router.post("/upload-excel", async (req, res) => {
  try {
    const { fileBase64 } = req.body; // Excel file in base64
    const buffer = Buffer.from(fileBase64, "base64");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    // Create students in DB
    await Student.deleteMany(); // optional: reset previous students
    const students = data.map((row) => ({
      name: row.Name,
      email: row.Email,
      rollNo: row.RollNo,
      mess: row.Mess,
    }));

    await Student.insertMany(students);

    res.json({ message: "Excel uploaded and students initialized", count: students.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin resets all student data for new semester
router.post("/reset-data", async (req, res) => {
  try {
    await Student.updateMany({}, { redeemedToken: false, hasUploadedPhoto: false, photoUrl: "" });
    await Menu.deleteMany();
    res.json({ message: "All student data and menu reset for new semester" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin can update menu
router.post("/update-menu", async (req, res) => {
    try {
      const { breakfast, lunch, dinner, dayOfWeek } = req.body;
      let menu = await Menu.findOne();
      if (!menu) menu = new Menu();
  
      menu.breakfast = breakfast || [];
      menu.lunch = lunch || [];
      menu.dinner = dinner || [];
      menu.dayOfWeek = dayOfWeek || []; // store the days
      menu.updatedAt = new Date();
  
      await menu.save();
      res.json({ message: "Menu updated", menu });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  

module.exports = router;
