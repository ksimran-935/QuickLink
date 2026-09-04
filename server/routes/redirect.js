const express = require("express");
const router = express.Router();
const { redirectUrl } = require("../controllers/urlController");

// Public route — no auth required
// Mounted at "/" in index.js so the full path is /:shortCode
router.get("/:shortCode", redirectUrl);

module.exports = router;
