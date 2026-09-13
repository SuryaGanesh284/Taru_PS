const AuditLog = require('../models/AuditLog');

/**
 * Record an audit log entry
 */
const audit = async ({ actorId, actorRole, action, resource, resourceId, metadata, ipAddress, requestId, success = true }) => {
  try {
    await AuditLog.create({
      actorId,
      actorRole,
      action,
      resource,
      resourceId,
      metadata,
      ipAddress,
      requestId,
      success,
    });
  } catch (_) {
    // Non-critical — don't throw audit failures
  }
};

module.exports = { audit };
