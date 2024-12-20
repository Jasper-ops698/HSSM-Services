const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboardControllers');
const verifyRole = require('../middlewares/verifyRole');

// Unified dashboard route
router.get('/dashboard', verifyRole(['individual', 'serviceProvider']), getDashboard);

module.exports = router;