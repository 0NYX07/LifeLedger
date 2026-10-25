/**
 * Format numerical amount to currency string
 */
export const formatCurrency = (amount, currency = 'INR') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '—';
  }

  const num = Number(amount);
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(num);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 2
  }).format(num);
};

/**
 * Format ISO date string to human-readable date
 */
export const formatDate = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Format relative deadline text
 */
export const formatRelativeDeadline = (dueDate) => {
  if (!dueDate) return '';
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const target = new Date(dueDate);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdue = Math.abs(diffDays);
    return `${overdue} day${overdue === 1 ? '' : 's'} overdue`;
  }
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays <= 7) return `Due in ${diffDays} days`;
  return `Due in ${diffDays} days`;
};

/**
 * Category metadata: display names, icons, badge styles
 */
export const CATEGORY_META = {
  subscription: {
    label: 'Subscription',
    bg: 'bg-purple-950/60 text-purple-300 border-purple-500/30'
  },
  bill: {
    label: 'Bill / Utility',
    bg: 'bg-blue-950/60 text-blue-300 border-blue-500/30'
  },
  purchase: {
    label: 'Purchase',
    bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
  },
  'return-window': {
    label: 'Return Window',
    bg: 'bg-amber-950/60 text-amber-300 border-amber-500/30'
  },
  warranty: {
    label: 'Warranty',
    bg: 'bg-teal-950/60 text-teal-300 border-teal-500/30'
  },
  insurance: {
    label: 'Insurance',
    bg: 'bg-sky-950/60 text-sky-300 border-sky-500/30'
  },
  'document-renewal': {
    label: 'Document Renewal',
    bg: 'bg-rose-950/60 text-rose-300 border-rose-500/30'
  },
  custom: {
    label: 'Custom',
    bg: 'bg-slate-800 text-slate-300 border-slate-700'
  }
};

/**
 * Urgency badge visual styles
 */
export const URGENCY_META = {
  overdue: {
    label: 'Overdue',
    bg: 'bg-red-500/20 text-red-400 border border-red-500/30'
  },
  'due-today': {
    label: 'Due Today',
    bg: 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
  },
  'due-soon': {
    label: 'Due Soon',
    bg: 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
  },
  upcoming: {
    label: 'Upcoming',
    bg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
  },
  completed: {
    label: 'Completed',
    bg: 'bg-slate-700/40 text-slate-400 border border-slate-600/30'
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-zinc-800 text-zinc-500 border border-zinc-700/30'
  }
};

/**
 * Priority badge visual styles
 */
export const PRIORITY_META = {
  high: {
    label: 'High Priority',
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
  },
  medium: {
    label: 'Medium Priority',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  },
  low: {
    label: 'Low Priority',
    color: 'text-slate-400 bg-slate-500/10 border-slate-500/20'
  }
};
