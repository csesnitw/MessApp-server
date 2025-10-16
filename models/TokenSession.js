const mongoose = require("mongoose");

const tokenSessionSchema = new mongoose.Schema({
  mess: String,
  active: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("tokenSession", tokenSessionSchema);
