const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

// sample route
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// connect DB + start server
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/mess")
  .then(() => {
    app.listen(5000, () => console.log("Server running on port 5000"));
  })
  .catch((err) => console.log(err));
