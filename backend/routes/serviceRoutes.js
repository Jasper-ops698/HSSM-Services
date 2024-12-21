const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { createService, getServices, updateService, deleteService } = require('../controllers/serviceController');
const router = express.Router();

router.post('/', protect, createService);
router.get('/', getServices); 
router.put('/:id', protect, updateService);
router.delete('/:id', protect, deleteService);

module.exports = router;