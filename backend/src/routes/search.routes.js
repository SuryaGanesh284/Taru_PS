const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { search, searchSuggestions, getTrending } = require('../controllers/search.controller');
const rateLimiter = require('../middleware/rateLimiter');

router.get('/', rateLimiter.search, optionalAuth, search);
router.get('/products', rateLimiter.search, optionalAuth, search);
router.get('/suggestions', searchSuggestions);
router.get('/trending', getTrending);

module.exports = router;
