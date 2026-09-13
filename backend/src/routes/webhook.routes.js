const express = require('express');
const router = express.Router();
const { handlePaymentWebhook } = require('../controllers/webhook.controller');

// Note: body is already raw (set up in app.js before json middleware)
router.post('/payments/:provider', handlePaymentWebhook);

module.exports = router;
