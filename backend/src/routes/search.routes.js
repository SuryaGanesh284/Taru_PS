const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { search } = require('../controllers/search.controller');
const rateLimiter = require('../middleware/rateLimiter');

router.get('/', rateLimiter.search, optionalAuth, search);

module.exports = router;
