const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(cors());


// Routes
require("./models/menu");
require("./models/updatedMenu");
const adminRoutes = require("./routes/adminRoutes");
const studentRoutes = require("./routes/studentRoutes");

app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);

// Sample root route
app.get("/", (req, res) => res.send("Backend is running"));

// Connect to DB and start server
console.log(process.env.MONGO_URI);
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/mess")
  .then(() => {
    app.listen(5000, () => console.log("Server running on port 5000"));
  })
  .catch((err) => console.log(err));
