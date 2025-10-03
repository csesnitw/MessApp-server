const mongoose = require("mongoose");

const updatedMenuSchema = new mongoose.Schema({
  messName: { type: String, required: true },
  dayOfWeek: { 
    type: String, 
    required: true,
    enum: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
  },
  breakfast: { type: [String], default: [] },
  lunch: { type: [String], default: [] },
  dinner: { type: [String], default: [] },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("UpdatedMenu", updatedMenuSchema);
