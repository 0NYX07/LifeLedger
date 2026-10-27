const { Activity } = require('../models/Activity');

/**
 * Log an activity record for an authenticated user
 */
const logActivity = async (userId, { action, resourceType = 'obligation', resourceId, title, description, details = {} }) => {
  try {
    if (!userId || !action || !resourceId || !title || !description) {
      return null;
    }

    const activity = await Activity.create({
      userId,
      action,
      resourceType,
      resourceId: resourceId.toString(),
      title,
      description,
      details
    });

    return activity;
  } catch (err) {
    // Avoid breaking main CRUD operations if activity logging encounters an error
    console.error('[ActivityService] Failed to log activity:', err.message);
    return null;
  }
};

/**
 * Fetch paginated activities for an authenticated user
 */
const getUserActivities = async (userId, { page = 1, limit = 20, action } = {}) => {
  const query = { userId };
  if (action && typeof action === 'string') {
    query.action = action;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [activities, total] = await Promise.all([
    Activity.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Activity.countDocuments(query)
  ]);

  return {
    activities,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
};

module.exports = {
  logActivity,
  getUserActivities
};
