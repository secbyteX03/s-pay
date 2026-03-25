// models/Escrow.js
const mongoose = require("mongoose");

const EscrowSchema = new mongoose.Schema({
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: "USD" },
  status: {
    type: String,
    enum: ["pending", "held", "released", "cancelled", "expired"],
    default: "pending",
  },
  releaseCondition: {
    type: String,
    enum: ["manual", "auto", "timebased"],
    default: "manual",
  },
  releaseAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  releasedAt: { type: Date },
  notes: { type: String },
});

EscrowSchema.index({ senderId: 1, status: 1 });
EscrowSchema.index({ recipientId: 1, status: 1 });

module.exports = mongoose.model("Escrow", EscrowSchema);
