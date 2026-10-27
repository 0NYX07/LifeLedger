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
    bg: 'bg-[#7C3AED]/20 text-[#C4B5FD] border border-[#7C3AED]/40'
  },
  bill: {
    label: 'Bill / Utility',
    bg: 'bg-[#1D9BF0]/20 text-[#7DD3FC] border border-[#1D9BF0]/40'
  },
  purchase: {
    label: 'Purchase',
    bg: 'bg-[#25D366]/20 text-[#86EFAC] border border-[#25D366]/40'
  },
  'return-window': {
    label: 'Return Window',
    bg: 'bg-[#F59E0B]/20 text-[#FCD34D] border border-[#F59E0B]/40'
  },
  warranty: {
    label: 'Warranty',
    bg: 'bg-[#0D9488]/20 text-[#5EEAD4] border border-[#0D9488]/40'
  },
  insurance: {
    label: 'Insurance',
    bg: 'bg-[#0284C7]/20 text-[#7DD3FC] border border-[#0284C7]/40'
  },
  'document-renewal': {
    label: 'Document Renewal',
    bg: 'bg-[#E11D48]/20 text-[#FDA4AF] border border-[#E11D48]/40'
  },
  custom: {
    label: 'Custom',
    bg: 'bg-[#293142] text-[#A0A8B7] border border-[#3B4559]'
  }
};

/**
 * Urgency badge visual styles
 */
export const URGENCY_META = {
  overdue: {
    label: 'Overdue',
    bg: 'bg-[#E53945]/20 text-[#FCA5A5] border border-[#E53945]/40'
  },
  'due-today': {
    label: 'Due Today',
    bg: 'bg-[#F59E0B]/20 text-[#FCD34D] border border-[#F59E0B]/40'
  },
  'due-soon': {
    label: 'Due Soon',
    bg: 'bg-[#1D9BF0]/20 text-[#7DD3FC] border border-[#1D9BF0]/40'
  },
  upcoming: {
    label: 'Upcoming',
    bg: 'bg-[#25D366]/20 text-[#86EFAC] border border-[#25D366]/40'
  },
  completed: {
    label: 'Completed',
    bg: 'bg-[#25D366]/15 text-[#86EFAC] border border-[#25D366]/30'
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-[#293142] text-[#A0A8B7] border border-[#3B4559]'
  }
};

/**
 * Priority badge visual styles
 */
export const PRIORITY_META = {
  high: {
    label: 'High Priority',
    color: 'text-[#FCA5A5] bg-[#E53945]/20 border border-[#E53945]/40'
  },
  medium: {
    label: 'Medium Priority',
    color: 'text-[#FCD34D] bg-[#F59E0B]/20 border border-[#F59E0B]/40'
  },
  low: {
    label: 'Low Priority',
    color: 'text-[#A0A8B7] bg-[#293142] border border-[#3B4559]'
  }
};
