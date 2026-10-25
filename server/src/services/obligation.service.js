/**
 * Normalize a date to midnight UTC/local calendar day boundary
 */
const toMidnight = (dateInput) => {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Calculate calendar day difference between target date and today
 */
const getDayDifference = (targetDate, baseDate = new Date()) => {
  const targetMidnight = toMidnight(targetDate);
  const baseMidnight = toMidnight(baseDate);
  const diffMs = targetMidnight.getTime() - baseMidnight.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Determine the urgency of an obligation based on its dueDate and status
 *
 * @param {Date|string} dueDate
 * @param {string} status 'active' | 'completed' | 'cancelled'
 * @param {Date} [baseDate]
 * @returns {'overdue' | 'due-today' | 'due-soon' | 'upcoming' | 'completed' | 'cancelled'}
 */
const calculateUrgency = (dueDate, status = 'active', baseDate = new Date()) => {
  if (status === 'completed') return 'completed';
  if (status === 'cancelled') return 'cancelled';

  const diffDays = getDayDifference(dueDate, baseDate);

  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'due-today';
  if (diffDays > 0 && diffDays <= 7) return 'due-soon';
  return 'upcoming';
};

/**
 * Generate Money Leak Detector warnings for active obligations
 */
const evaluateMoneyLeak = (obligation, baseDate = new Date()) => {
  if (obligation.status !== 'active') return null;

  const urgency = calculateUrgency(obligation.dueDate, obligation.status, baseDate);
  const diffDays = getDayDifference(obligation.dueDate, baseDate);

  // We highlight overdue, due-today, and due-soon (<= 7 days)
  if (!['overdue', 'due-today', 'due-soon'].includes(urgency)) {
    return null;
  }

  let reason = '';
  let suggestedAction = '';

  const dueDateFormatted = new Date(obligation.dueDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  if (urgency === 'overdue') {
    const overdueDays = Math.abs(diffDays);
    reason = `Overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'} (deadline was ${dueDateFormatted}).`;
    suggestedAction =
      obligation.category === 'subscription'
        ? 'Review active status or cancel immediately to stop recurring charges.'
        : obligation.category === 'bill'
        ? 'Settle payment immediately to avoid penalty interest or utility disruption.'
        : obligation.category === 'return-window'
        ? 'Check if store accepts late returns or store credit.'
        : 'Take action now or mark as completed/cancelled if already resolved.';
  } else if (urgency === 'due-today') {
    reason = 'Deadline expires today!';
    suggestedAction =
      obligation.category === 'subscription'
        ? 'Decide whether to keep or cancel subscription before midnight auto-renewal.'
        : obligation.category === 'return-window'
        ? 'Today is the final day to drop off or ship return for full refund.'
        : obligation.category === 'bill'
        ? 'Submit bill payment today to avoid late payment penalties.'
        : 'Complete required action today before deadline closes.';
  } else {
    // due-soon (1 to 7 days)
    const daysLeft = diffDays;
    switch (obligation.category) {
      case 'subscription':
        reason = `Auto-renewal scheduled in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`;
        suggestedAction = 'Evaluate usage: keep active or cancel before next billing cycle.';
        break;
      case 'return-window':
        reason = `Return eligibility closes in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`;
        suggestedAction = 'Inspect product and initiate merchant return to guarantee refund.';
        break;
      case 'warranty':
        reason = `Warranty coverage ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`;
        suggestedAction = 'Inspect device/product for defects before warranty claim window expires.';
        break;
      case 'insurance':
        reason = `Insurance policy renewal due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`;
        suggestedAction = 'Compare renewal premium or ensure active renewal to avoid coverage lapse.';
        break;
      case 'document-renewal':
        reason = `Document expiry in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`;
        suggestedAction = 'Gather necessary paperwork and submit renewal request.';
        break;
      case 'bill':
        reason = `Bill due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`;
        suggestedAction = 'Schedule payment to ensure timely processing.';
        break;
      default:
        reason = `Deadline approaching in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`;
        suggestedAction = 'Review details and complete pending steps in advance.';
        break;
    }
  }

  return {
    obligationId: obligation._id,
    title: obligation.title,
    category: obligation.category,
    dueDate: obligation.dueDate,
    urgency,
    priority: obligation.priority,
    amount: obligation.amount != null ? obligation.amount : null,
    currency: obligation.currency || 'INR',
    daysDifference: diffDays,
    reason,
    suggestedAction,
    notice: 'Potential cost if no action is taken'
  };
};

/**
 * Calculate financial summary metrics for a list of obligations
 */
const calculateFinancialSummary = (obligations, baseDate = new Date()) => {
  let monthlyRecurring = 0;
  let yearlyRecurring = 0;
  let upcomingPayments30Days = 0;
  let totalActiveExposure = 0;
  let countWithAmount = 0;

  const nowMidnight = toMidnight(baseDate);
  const thirtyDaysOut = new Date(nowMidnight.getTime() + 30 * 24 * 60 * 60 * 1000);

  obligations.forEach((obs) => {
    // Only active records count toward forward-looking totals
    if (obs.status !== 'active') return;

    const amt = typeof obs.amount === 'number' && obs.amount >= 0 ? obs.amount : 0;
    if (amt > 0) {
      countWithAmount += 1;
      totalActiveExposure += amt;
    }

    // Monthly recurring costs include only active records explicitly marked as monthly recurring
    if (obs.recurrence === 'monthly' && amt > 0) {
      monthlyRecurring += amt;
    }

    // Yearly recurring costs
    if (obs.recurrence === 'yearly' && amt > 0) {
      yearlyRecurring += amt;
    }

    // Upcoming payments in the next 30 days
    const dueMidnight = toMidnight(obs.dueDate);
    if (dueMidnight >= nowMidnight && dueMidnight <= thirtyDaysOut && amt > 0) {
      upcomingPayments30Days += amt;
    }
  });

  const annualEstimate = monthlyRecurring * 12 + yearlyRecurring;

  return {
    monthlyRecurring: Math.round(monthlyRecurring * 100) / 100,
    annualEstimate: Math.round(annualEstimate * 100) / 100,
    upcomingPayments30Days: Math.round(upcomingPayments30Days * 100) / 100,
    totalActiveExposure: Math.round(totalActiveExposure * 100) / 100,
    trackedRecordsWithAmount: countWithAmount,
    label: 'Estimates based on user-entered information'
  };
};

module.exports = {
  toMidnight,
  getDayDifference,
  calculateUrgency,
  evaluateMoneyLeak,
  calculateFinancialSummary
};
