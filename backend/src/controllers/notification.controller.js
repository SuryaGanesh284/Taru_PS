const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorHandler');
const { success, paginated, noContent } = require('../utils/response');

const listNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const filter = { userId: req.userId };
    if (req.query.unread === 'true') filter.isRead = false;

    const [notifications, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
    ]);

    return paginated(res, notifications, { page, limit, total });
  } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.notificationId, userId: req.userId });
    if (!notification) throw new AppError('Notification not found', 404, 'NOT_FOUND');
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
    return success(res, notification);
  } catch (err) { next(err); }
};

const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return success(res, { message: 'All notifications marked as read' });
  } catch (err) { next(err); }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ userId: req.userId, isRead: false });
    return success(res, { count });
  } catch (err) { next(err); }
};

module.exports = { listNotifications, markRead, markAllRead, getUnreadCount };
