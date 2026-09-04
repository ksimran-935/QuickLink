const jwt = require("jsonwebtoken");

// Protects routes that require a logged-in user.
// Reads the JWT from the Authorization header: "Bearer <token>"
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // verify() throws if the token is invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, iat, exp }
    next();
  } catch (err) {
    next(err); // passes to centralized error handler
  }
};

module.exports = protect;
