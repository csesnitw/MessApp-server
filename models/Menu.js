const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
  dayOfWeek: { type: String, required: true, unique: true }, 
  breakfast: { type: [String], default: [] },
  lunch: { type: [String], default: [] },
  dinner: { type: [String], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Menu", menuSchema);
