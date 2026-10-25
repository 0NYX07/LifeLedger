const { Obligation } = require('../models/Obligation');
const {
  calculateUrgency,
  evaluateMoneyLeak,
  calculateFinancialSummary
} = require('../services/obligation.service');

/**
 * Retrieve dashboard statistics, money leak alerts, and financial estimates
 * GET /api/dashboard/summary
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch all obligations belonging to user
    const obligations = await Obligation.find({ userId }).sort({ dueDate: 1 });

    const counts = {
      total: obligations.length,
      active: 0,
      completed: 0,
      cancelled: 0,
      overdue: 0,
      dueToday: 0,
      dueSoon: 0,
      upcoming: 0
    };

    const moneyLeakAlerts = [];
    const overdueObligations = [];
    const upcomingObligations = [];

    obligations.forEach((obs) => {
      const urgency = calculateUrgency(obs.dueDate, obs.status);
      const jsonDoc = obs.toJSON();
      jsonDoc.urgency = urgency;

      if (obs.status === 'completed') {
        counts.completed += 1;
      } else if (obs.status === 'cancelled') {
        counts.cancelled += 1;
      } else if (obs.status === 'active') {
        counts.active += 1;

        if (urgency === 'overdue') {
          counts.overdue += 1;
          overdueObligations.push(jsonDoc);
        } else if (urgency === 'due-today') {
          counts.dueToday += 1;
          upcomingObligations.push(jsonDoc);
        } else if (urgency === 'due-soon') {
          counts.dueSoon += 1;
          upcomingObligations.push(jsonDoc);
        } else if (urgency === 'upcoming') {
          counts.upcoming += 1;
          upcomingObligations.push(jsonDoc);
        }

        // Evaluate money leak
        const leak = evaluateMoneyLeak(obs);
        if (leak) {
          moneyLeakAlerts.push(leak);
        }
      }
    });

    // Calculate deterministic financial summary
    const financialSummary = calculateFinancialSummary(obligations);

    res.status(200).json({
      success: true,
      data: {
        counts,
        moneyLeakAlerts,
        financialSummary,
        overdueList: overdueObligations.slice(0, 5),
        upcomingList: upcomingObligations.slice(0, 5)
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardSummary
};
