const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { recordEvent } = require('../controllers/event.controller');

router.post('/', optionalAuth, recordEvent);

module.exports = router;
