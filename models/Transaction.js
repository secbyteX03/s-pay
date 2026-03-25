// models/Transaction.js
const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    type: {
      type: String,
      enum: ["deposit", "withdrawal", "transfer", "payment"],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    timestamp: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["pending", "completed", "blocked", "flagged"],
      default: "pending",
    },
    description: { type: String },
    recipient: { type: String },
    location: { type: String },
    deviceId: { type: String },
    ipAddress: { type: String },
    riskScore: { type: Number, default: 0 },
    riskFlags: [{ type: String }],
    isSuspicious: { type: Boolean, default: false },
    fraudReason: { type: String },
  },
  { timestamps: true }
);

// Index for faster queries
TransactionSchema.index({ username: 1, timestamp: -1 });
TransactionSchema.index({ username: 1, status: 1 });

module.exports = mongoose.model("Transaction", TransactionSchema);
