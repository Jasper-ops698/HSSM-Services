const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const notificationController = require('../controllers/notificationController');

// @route   GET /api/notifications
// @desc    Get all notifications for a user
// @access  Private
router.get('/', protect, notificationController.getNotifications);

// @route   PUT /api/notifications/mark-read
// @desc    Mark notifications as read
// @access  Private
router.put('/mark-read', protect, notificationController.markNotificationsAsRead);

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.put('/mark-all-read', protect, notificationController.markAllNotificationsAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Delete a single notification by ID (for the current user)
// @access  Private
router.delete('/:id', protect, notificationController.deleteNotification);

// @route   DELETE /api/notifications
// @desc    Delete all notifications for the current user
// @access  Private
router.delete('/', protect, notificationController.deleteAllNotifications);

// Route to register a device for push notifications
router.post('/register-device', protect, notificationController.registerDevice);

module.exports = router;
