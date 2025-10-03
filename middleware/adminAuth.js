const jwt = require("jsonwebtoken");

function verifyAdmin(req, res, next) {
  const authHeader = req.headers["authorization"]; 
  const token = authHeader?.split(" ")[1]; 

  if (!token) return res.status(401).json({ message: "Access denied" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (verified.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }
    req.user = verified; 
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
}

module.exports = { verifyAdmin };
