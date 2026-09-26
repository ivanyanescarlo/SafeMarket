const ActivityLog = require('../models/ActivityLog');

async function logActivity({ userId = null, userEmail = '', action, targetType = 'System', targetId = '', details = {}, ip = '' }) {
  try {
    await ActivityLog.create({
      userId,
      userEmail,
      action,
      targetType,
      targetId: String(targetId || ''),
      details,
      ip
    });
  } catch (err) {
    console.error(`[ActivityLog Error] Failed to log activity: ${err.message}`);
  }
}

module.exports = { logActivity };
