const activityService = require('../services/activity.service');

const getActivities = async (req, res, next) => {
  try {
    const { page, limit, action } = req.query;
    const result = await activityService.getUserActivities(req.user.id, {
      page,
      limit,
      action
    });

    res.status(200).json({
      success: true,
      data: result.activities,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getActivities
};
