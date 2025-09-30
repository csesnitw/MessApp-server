const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

const messCardRoutes = require("./routes/messCardRoutes");
app.use("/messcard", messCardRoutes);



app.get("/", (req, res) => {
  res.send("Backend is running");
});


mongoose.connect(process.env.MONGODB_URI)

  .then(() => {
    console.log("MongoDB connected");
    app.listen(5000, () => console.log("✅ Server running on port 5000"));
  })
  .catch(err => console.error(err));



