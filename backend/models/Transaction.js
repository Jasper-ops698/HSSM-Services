const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  TransactionID: { type: String, required: true, unique: true },
  Amount: { type: Number, required: true },
  PhoneNumber: { type: String, required: true },
  Status: { type: String, required: true },
  CreatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transaction", transactionSchema);