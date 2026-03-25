// models/Wallet.js
const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["fiat", "crypto"],
    required: true,
  },
  currency: { type: String, required: true },
  balance: { type: Number, default: 0 },
  frozenBalance: { type: Number, default: 0 },
  publicAddress: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

WalletSchema.methods.getAvailableBalance = function () {
  return this.balance - this.frozenBalance;
};

WalletSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Wallet", WalletSchema);
