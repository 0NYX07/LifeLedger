const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const { authenticate } = require('../middleware/auth');

// All activity routes require authentication
router.use(authenticate);

router.get('/', activityController.getActivities);

module.exports = router;
