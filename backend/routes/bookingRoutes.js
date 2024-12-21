const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const Booking = require('../models/Booking');
const { check, validationResult } = require('express-validator');

const router = express.Router();

/**
 * Async Handler Middleware to Simplify Error Handling
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Create Booking (User Only)
router.post(
  '/',
  protect,
  authorize('user'),
  [
    check('serviceId').notEmpty().withMessage('Service ID is required'),
    check('date').isISO8601().withMessage('A valid date is required'),
    check('time').notEmpty().withMessage('Time is required'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const booking = new Booking({
      ...req.body,
      userId: req.user._id,
    });
    await booking.save();
    res.status(201).json(booking);
  })
);

// Get Bookings for Service Provider
router.get(
  '/provider',
  protect,
  authorize('provider'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, sortBy = 'date', order = 'asc' } = req.query;

    const filter = { providerId: req.user._id };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('userId', 'name email')
      .populate('serviceId', 'name')
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const totalCount = await Booking.countDocuments(filter);

    res.json({
      bookings,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page),
    });
  })
);

// Get User Bookings
router.get(
  '/user',
  protect,
  authorize('user'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, sortBy = 'date', order = 'asc' } = req.query;

    const filter = { userId: req.user._id };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('providerId', 'name email')
      .populate('serviceId', 'name')
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const totalCount = await Booking.countDocuments(filter);

    res.json({
      bookings,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page),
    });
  })
);

module.exports = router;