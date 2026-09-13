const express = require('express');
const router = express.Router();
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const recCtrl = require('../controllers/recommendation.controller');

router.get('/', optionalAuth, recCtrl.getRecommendations);
router.get('/home', optionalAuth, recCtrl.getRecommendations);
router.post('/feedback', authenticate, recCtrl.recordFeedback);
router.post('/generate', authenticate, authorize('ADMIN'), recCtrl.generateRecommendations);

module.exports = router;
