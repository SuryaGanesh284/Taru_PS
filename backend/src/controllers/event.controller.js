const Event = require('../models/Event');
const { success } = require('../utils/response');

/**
 * POST /events - Record a behavior event
 */
const recordEvent = async (req, res, next) => {
  try {
    const { type, entityId, entityType, metadata, sessionId } = req.body;

    await Event.create({
      userId: req.user?._id,
      sessionId,
      type,
      entityId,
      entityType,
      metadata,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return success(res, { recorded: true });
  } catch (err) { next(err); }
};

module.exports = { recordEvent };
