const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(cors());


// Routes
const adminRoutes = require("./routes/adminRoutes");
const studentRoutes = require("./routes/studentroutes");

app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);

// Sample root route
app.get("/", (req, res) => res.send("Backend is running"));

// Connect to DB and start server
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/mess")
  .then(() => {
    app.listen(5002, () => console.log("Server running on port 5002"));
  })
  .catch((err) => console.log(err));
