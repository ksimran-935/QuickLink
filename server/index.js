require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const urlRoutes = require("./routes/urls");
const redirectRoutes = require("./routes/redirect");
const errorHandler = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiter");

const app = express();

// --- Connect to MongoDB ---
connectDB();

// --- Middleware ---
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json({ limit: "10kb" })); // reject oversized payloads

// --- Rate limit all API routes ---
app.use("/api", apiLimiter);

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/urls", urlRoutes);

// Health check — useful for quick verification
app.get("/health", (req, res) => res.json({ status: "ok" }));

// --- Short-code redirect (must come AFTER /api routes) ---
// /:shortCode would match anything, so API routes must be registered first.
// Express matches routes in registration order.
app.use("/", redirectRoutes);

// --- Centralized error handler (must be last) ---
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
