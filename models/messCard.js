const mongoose = require("mongoose");

const messCardSchema = new mongoose.Schema({
  rollNo: { type: String, required: true, unique: true },
  name: String,
  image: String,
  messName: String,
});

module.exports = mongoose.model("MessCard", messCardSchema, "messCards");

