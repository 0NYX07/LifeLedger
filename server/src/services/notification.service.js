const { Notification } = require('../models/Notification');
const { Obligation } = require('../models/Obligation');

/**
 * Idempotently sync due/overdue reminders for an authenticated user
 */
const syncDueNotifications = async (userId) => {
  try {
    const activeObligations = await Obligation.find({
      userId,
      status: 'active'
    }).lean();

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const operations = [];

    for (const obs of activeObligations) {
      if (!obs.dueDate) continue;

      const target = new Date(obs.dueDate);
      target.setHours(0, 0, 0, 0);

      const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const dateKey = target.toISOString().split('T')[0];

      let notifType = null;
      let title = '';
      let message = '';

      if (diffDays < 0) {
        notifType = 'overdue';
        const overdueDays = Math.abs(diffDays);
        title = `Overdue: ${obs.title}`;
        message = `"${obs.title}" is ${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue. Please take action to avoid penalties or money leaks.`;
      } else if (diffDays === 0) {
        notifType = 'due_today';
        title = `Due Today: ${obs.title}`;
        message = `"${obs.title}" is due today.`;
      } else if (diffDays <= 3) {
        notifType = 'due_soon';
        title = `Due Soon: ${obs.title}`;
        message = `"${obs.title}" is due in ${diffDays} day${diffDays === 1 ? '' : 's'}.`;
      }

      if (notifType) {
        const dedupKey = `${userId}:${obs._id}:${dateKey}:${notifType}`;
        operations.push({
          updateOne: {
            filter: { userId, dedupKey },
            update: {
              $setOnInsert: {
                userId,
                type: notifType,
                title,
                message,
                obligationId: obs._id,
                isRead: false,
                dedupKey,
                createdAt: new Date()
              }
            },
            upsert: true
          }
        });
      }
    }

    if (operations.length > 0) {
      await Notification.bulkWrite(operations, { ordered: false });
    }
  } catch (err) {
    console.error('[NotificationService] Error syncing due notifications:', err.message);
  }
};

/**
 * Record a lifecycle notification (e.g. Next recurrence scheduled)
 */
const createLifecycleNotification = async (userId, { type = 'lifecycle', title, message, obligationId, dedupSuffix }) => {
  try {
    const dedupKey = `${userId}:${obligationId || 'general'}:${dedupSuffix || Date.now()}:${type}`;
    await Notification.updateOne(
      { userId, dedupKey },
      {
        $setOnInsert: {
          userId,
          type,
          title,
          message,
          obligationId,
          isRead: false,
          dedupKey,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
  } catch (err) {
    console.error('[NotificationService] Failed to create lifecycle notification:', err.message);
  }
};

/**
 * Get all notifications and unread count for user
 */
const getUserNotifications = async (userId) => {
  await syncDueNotifications(userId);

  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    Notification.countDocuments({ userId, isRead: false })
  ]);

  return {
    notifications,
    unreadCount
  };
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  return notification;
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return { success: true };
};

module.exports = {
  syncDueNotifications,
  createLifecycleNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead
};
