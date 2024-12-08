const express = require("express");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const Service = require("../models/Service");

const router = express.Router();

// Create Service (Provider Only)
router.post("/", authenticate, authorize("provider"), async (req, res) => {
  try {
    const service = new Service({ ...req.body, providerId: req.user._id });
    await service.save();
    res.status(201).json(service);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get All Services
router.get("/", async (req, res) => {
  try {
    const services = await Service.find().populate("providerId", "name email");
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;