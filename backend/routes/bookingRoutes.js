const express = require("express");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const Booking = require("../models/Booking");

const router = express.Router();

// Create Booking (User Only)
router.post("/", authenticate, authorize("user"), async (req, res) => {
  try {
    const booking = new Booking({
      ...req.body,
      userId: req.user._id,
    });
    await booking.save();
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get Bookings for Service Provider
router.get("/provider", authenticate, authorize("provider"), async (req, res) => {
  try {
    const bookings = await Booking.find({ providerId: req.user._id })
      .populate("userId", "name email")
      .populate("serviceId", "name");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get User Bookings
router.get("/user", authenticate, authorize("user"), async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate("providerId", "name email")
      .populate("serviceId", "name");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;