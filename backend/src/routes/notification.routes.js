const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const notifCtrl = require('../controllers/notification.controller');

router.use(authenticate);
router.get('/', notifCtrl.listNotifications);
router.get('/unread-count', notifCtrl.getUnreadCount);
router.patch('/:notificationId/read', notifCtrl.markRead);
router.post('/read-all', notifCtrl.markAllRead);

module.exports = router;
