const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { createRequest, getUserRequests, updateRequestStatus } = require('../controllers/requestControllers');
const router = express.Router();

router.post('/', protect, createRequest);
router.get('/', protect, getUserRequests);
router.put('/:id', protect, updateRequestStatus);

module.exports = router;