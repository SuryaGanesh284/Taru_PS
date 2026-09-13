const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const categoryCtrl = require('../controllers/category.controller');

router.get('/', categoryCtrl.listCategories);
router.get('/:categoryId', categoryCtrl.getCategory);

// Admin-only write operations
router.post('/', authenticate, authorize('ADMIN'), categoryCtrl.createCategory);
router.patch('/:categoryId', authenticate, authorize('ADMIN'), categoryCtrl.updateCategory);
router.delete('/:categoryId', authenticate, authorize('ADMIN'), categoryCtrl.deactivateCategory);

module.exports = router;
