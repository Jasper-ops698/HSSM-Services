const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ["pending", "confirmed", "completed"], default: "pending" },
});

module.exports = mongoose.model("Booking",BookingSchema);