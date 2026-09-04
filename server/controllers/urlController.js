const Url = require("../models/Url");
const Click = require("../models/Click");
const generateCode = require("../utils/generateCode");
const { body } = require("express-validator");

// ─── Validation Rules ──────────────────────────────────────────────────────────

const createUrlRules = [
  body("longUrl")
    .customSanitizer((v) => (typeof v === "string" ? v.trim() : v))
    .notEmpty().withMessage("URL is required")
    .isURL({ require_protocol: true })
    .withMessage("Must be a valid URL (include http:// or https://)"),

  body("alias")
    .optional()
    .trim()
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Alias may only contain letters, numbers, hyphens, and underscores")
    .isLength({ min: 3, max: 30 })
    .withMessage("Alias must be 3–30 characters"),

  body("expiresAt")
    .optional()
    .isISO8601().withMessage("expiresAt must be a valid ISO 8601 date (e.g. 2025-12-31)")
    .custom((val) => {
      if (new Date(val) <= new Date()) throw new Error("Expiry date must be in the future");
      return true;
    }),
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const generateUniqueCode = async (maxAttempts = 5) => {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateCode(7);
    const exists = await Url.exists({ shortCode: code });
    if (!exists) return code;
  }
  return null;
};

const getBaseUrl = () =>
  process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

// ─── POST /api/urls ────────────────────────────────────────────────────────────

const createUrl = async (req, res, next) => {
  try {
    const { longUrl, alias, expiresAt } = req.body;
    let shortCode;

    if (alias) {
      const taken = await Url.exists({ shortCode: alias });
      if (taken) return res.status(409).json({ message: "Alias already taken, choose another" });
      shortCode = alias;
    } else {
      shortCode = await generateUniqueCode();
      if (!shortCode) return res.status(500).json({ message: "Could not generate a unique code, please try again" });
    }

    const url = await Url.create({
      shortCode,
      longUrl,
      owner: req.user.id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    res.status(201).json({
      id: url._id,
      shortCode: url.shortCode,
      longUrl: url.longUrl,
      shortUrl: `${getBaseUrl()}/${url.shortCode}`,
      clicks: url.clicks,
      expiresAt: url.expiresAt,
      createdAt: url.createdAt,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/urls  (list with search + pagination) ───────────────────────────

const getUrls = async (req, res, next) => {
  try {
    // Parse and sanitise query params
    const search = (req.query.search || "").trim();
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip   = (page - 1) * limit;

    // Base filter: only this user's URLs
    const filter = { owner: req.user.id };

    if (search) {
      // Case-insensitive partial match on either field.
      // $regex is fine at this scale; for millions of docs, use a text index.
      filter.$or = [
        { shortCode: { $regex: search, $options: "i" } },
        { longUrl:   { $regex: search, $options: "i" } },
      ];
    }

    // Run both queries in parallel — no reason to wait on them sequentially
    const [urls, total] = await Promise.all([
      Url.find(filter)
        .sort({ createdAt: -1 })   // newest first
        .skip(skip)
        .limit(limit)
        .select("-__v"),            // strip internal Mongoose field
      Url.countDocuments(filter),
    ]);

    const baseUrl = getBaseUrl();

    res.json({
      urls: urls.map((u) => ({
        id: u._id,
        shortCode: u.shortCode,
        longUrl: u.longUrl,
        shortUrl: `${baseUrl}/${u.shortCode}`,
        clicks: u.clicks,
        expiresAt: u.expiresAt,
        createdAt: u.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/urls/:id ──────────────────────────────────────────────────────

const deleteUrl = async (req, res, next) => {
  try {
    const url = await Url.findById(req.params.id);

    if (!url) return res.status(404).json({ message: "URL not found" });

    // Ownership check — a user must not be able to delete someone else's URL
    if (url.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorised to delete this URL" });
    }

    await Url.findByIdAndDelete(req.params.id);

    // Clean up associated click records so we don't leave orphaned data
    await Click.deleteMany({ url: req.params.id });

    res.json({ message: "URL deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/urls/:id/analytics ──────────────────────────────────────────────

const getAnalytics = async (req, res, next) => {
  try {
    const url = await Url.findById(req.params.id).select("-__v");

    if (!url) return res.status(404).json({ message: "URL not found" });

    if (url.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorised to view this URL's analytics" });
    }

    // Return the 20 most recent individual click events
    const recentClicks = await Click.find({ url: req.params.id })
      .sort({ timestamp: -1 })
      .limit(20)
      .select("timestamp referrer userAgent -_id");

    res.json({
      shortCode: url.shortCode,
      longUrl: url.longUrl,
      shortUrl: `${getBaseUrl()}/${url.shortCode}`,
      totalClicks: url.clicks,
      expiresAt: url.expiresAt,
      createdAt: url.createdAt,
      recentClicks,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /:shortCode  (public redirect) ───────────────────────────────────────

const redirectUrl = async (req, res, next) => {
  try {
    const { shortCode } = req.params;
    const url = await Url.findOne({ shortCode });

    if (!url) return res.status(404).json({ message: "Short URL not found" });

    // Manual expiry check — TTL index has up to ~60s lag
    if (url.expiresAt && url.expiresAt < new Date()) {
      return res.status(410).json({ message: "This short URL has expired" });
    }

    // Atomic increment on the Url document
    await Url.findByIdAndUpdate(url._id, { $inc: { clicks: 1 } });

    // Record the click event (non-blocking best-effort — we don't await error propagation)
    Click.create({
      url: url._id,
      referrer: req.headers.referer || req.headers.referrer || "Direct",
      userAgent: req.headers["user-agent"] || "Unknown",
    }).catch((err) => console.error("Click record error:", err.message));

    // 302 = temporary; browser won't cache, so every hit reaches us for tracking
    res.redirect(302, url.longUrl);
  } catch (err) {
    next(err);
  }
};

module.exports = { createUrl, getUrls, deleteUrl, getAnalytics, redirectUrl, createUrlRules };
