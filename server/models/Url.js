const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
  {
    shortCode: {
      type: String,
      required: true,
      unique: true,  // indexed — fast lookups on redirect
    },
    longUrl: {
      type: String,
      required: [true, "Original URL is required"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      default: null, // null means no expiration
    },
  },
  { timestamps: true }
);

// Compound index: lets us efficiently list all URLs for a user, sorted by date
urlSchema.index({ owner: 1, createdAt: -1 });

// TTL index: MongoDB auto-deletes expired documents
// Only deletes when expiresAt is set (not null)
urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { expiresAt: { $type: "date" } } });

module.exports = mongoose.model("Url", urlSchema);
