const rateLimit = require("express-rate-limit");

// Applied to auth routes to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 requests per window per IP
  message: { message: "Too many requests, please try again later" },
  standardHeaders: true,     // sends RateLimit-* headers
  legacyHeaders: false,
});

// General API limiter — reasonable ceiling for normal usage
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, apiLimiter };
