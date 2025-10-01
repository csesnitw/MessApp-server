const mongoose = require("mongoose");

const enrolledStudentSchema = new mongoose.Schema({
  name: String,
  RollNo: { type: String, unique: true },
  mess: String,
});

module.exports = mongoose.model("EnrolledStudent", enrolledStudentSchema);
