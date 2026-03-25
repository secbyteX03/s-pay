// models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  secret: { type: String }, // For OTP secret
  isBlocked: { type: Boolean, default: false },
  blockReason: { type: String },
  failedLoginAttempts: { type: Number, default: 0 },
  lastLoginAttempt: { type: Date },
  accountBalance: { type: Number, default: 0 },
  phoneNumber: { type: String },
  email: { type: String },
  createdAt: { type: Date, default: Date.now },

  // Daily transaction limit
  dailyLimit: { type: Number, default: 10000 },

  // Trusted device - skip OTP after first successful login
  isTrustedDevice: { type: Boolean, default: false },
  deviceId: { type: String },

  // Limit change request (requires approval)
  pendingLimitChange: {
    newLimit: { type: Number },
    requestedAt: { type: Date },
    approved: { type: Boolean, default: false },
    approvedAt: { type: Date },
    otpVerified: { type: Boolean, default: false },
  },

  // Track today's transactions for daily limit
  todayTransactions: [
    {
      date: { type: Date },
      amount: { type: Number },
    },
  ],
});

module.exports = mongoose.model("User", UserSchema);
