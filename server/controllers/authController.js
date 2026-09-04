const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { body } = require("express-validator");
const validate = require("../middleware/validate");

// --- Validation rule arrays ---
// These are applied as route middleware before the controller function runs

const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const loginRules = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

// --- Token helper ---
const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

// --- POST /api/auth/register ---
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check for existing user — friendlier than relying on the DB unique error alone
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // passwordHash field triggers the pre-save bcrypt hook in User model
    const user = await User.create({ name, email, passwordHash: password });

    const token = signToken(user);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

// --- POST /api/auth/login ---
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    // Use a single generic message — don't reveal whether email exists
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, registerRules, loginRules };
