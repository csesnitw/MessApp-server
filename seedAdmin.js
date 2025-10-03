const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/admin"); 

mongoose.connect("mongodb+srv://MessAppUser:CSESMessApp@cluster1.6h44x9u.mongodb.net/messDB")
  .then(async () => {
    const hashedPw = await bcrypt.hash("LHMessAdmin1", 10);
    await Admin.create({
      username: "admin2",
      password: hashedPw,
      messName: "MegaMess"
    });
    console.log("Admin created \n");
    console.log(hashedPw);
    mongoose.connection.close();
  })
  .catch(err => console.log(err));
