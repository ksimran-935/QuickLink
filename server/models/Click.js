const mongoose = require("mongoose");

// Each document represents one click event on a short URL.
// Keeping clicks in a separate collection avoids the URL document
// growing unboundedly as clicks accumulate.
const clickSchema = new mongoose.Schema({
  url: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Url",
    required: true,
  },
  referrer: {
    type: String,
    default: "Direct", // no Referer header = user typed the URL / came from a bookmark
  },
  userAgent: {
    type: String,
    default: "Unknown",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Index on url — all analytics queries filter by url first
clickSchema.index({ url: 1, timestamp: -1 });

module.exports = mongoose.model("Click", clickSchema);
