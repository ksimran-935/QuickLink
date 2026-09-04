const express = require("express");
const router = express.Router();
const { authLimiter } = require("../middleware/rateLimiter");
const validate = require("../middleware/validate");
const {
  register,
  login,
  registerRules,
  loginRules,
} = require("../controllers/authController");

// Rate limit applied to both auth endpoints
router.post("/register", authLimiter, registerRules, validate, register);
router.post("/login",    authLimiter, loginRules,    validate, login);

module.exports = router;
