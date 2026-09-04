const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  createUrl,
  getUrls,
  deleteUrl,
  getAnalytics,
  createUrlRules,
} = require("../controllers/urlController");

// All routes below require a valid JWT
router.post("/",              protect, createUrlRules, validate, createUrl);
router.get("/",               protect, getUrls);
router.delete("/:id",         protect, deleteUrl);
router.get("/:id/analytics",  protect, getAnalytics);

module.exports = router;
