const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const recCtrl = require('../controllers/recommendation.controller');

router.get('/', authenticate, recCtrl.getRecommendations);
router.post('/feedback', authenticate, recCtrl.recordFeedback);
router.post('/generate', authenticate, authorize('ADMIN'), recCtrl.generateRecommendations);

module.exports = router;
