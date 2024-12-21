const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { addServiceProvider, deleteServiceProvider, getAllData } = require('../controllers/adminController');
const router = express.Router();

router.post('/serviceProvider', protect, adminMiddleware, addServiceProvider);
router.delete('/serviceProvider/:id', protect, adminMiddleware, deleteServiceProvider);
router.get('/analytics', protect, adminMiddleware, getAllData);

module.exports = router;
