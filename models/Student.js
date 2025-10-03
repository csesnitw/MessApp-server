const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: String,
  rollNo: { type: String, required: true, unique: true },
  mess: String,
  hasUploadedPhoto: { type: Boolean, default: false },
  photoUrl: { type: String, default: "" },
  specialToken: {
    active: { type: Boolean, default: false },
    redeemed: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Student", studentSchema);
