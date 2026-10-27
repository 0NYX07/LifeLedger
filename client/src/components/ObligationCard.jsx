import React from 'react';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Repeat,
  AlertCircle,
  FileText
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  formatRelativeDeadline,
  CATEGORY_META,
  URGENCY_META,
  PRIORITY_META
} from '../utils/formatters';

export const ObligationCard = ({
  obligation,
  onEdit,
  onComplete,
  onCancel,
  onDelete
}) => {
  const isCompleted = obligation.status === 'completed';
  const isCancelled = obligation.status === 'cancelled';
  const isActive = obligation.status === 'active';

  const categoryMeta = CATEGORY_META[obligation.category] || CATEGORY_META.custom;
  const urgencyMeta = URGENCY_META[obligation.urgency] || URGENCY_META.upcoming;
  const priorityMeta = PRIORITY_META[obligation.priority] || PRIORITY_META.medium;

  return (
    <div
      className={`glass-card rounded-2xl p-5 border flex flex-col justify-between relative overflow-hidden transition-all ${
        isCompleted
          ? 'opacity-70 bg-slate-900/40 border-slate-800'
          : isCancelled
          ? 'opacity-60 bg-zinc-950/40 border-zinc-800/80'
          : obligation.urgency === 'overdue'
          ? 'border-red-500/30 bg-slate-900/60 shadow-lg shadow-red-950/20'
          : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
      }`}
    >
      {/* Top badges */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${categoryMeta.bg}`}
            >
              {categoryMeta.label}
            </span>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${priorityMeta.color}`}
            >
              {priorityMeta.label}
            </span>
            {obligation.recurrence && obligation.recurrence !== 'none' && (
              <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                <Repeat className="w-3 h-3" />
                <span className="capitalize">{obligation.recurrence}</span>
              </span>
            )}
          </div>

          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${urgencyMeta.bg}`}
          >
            {urgencyMeta.label}
          </span>
        </div>

        {/* Title and Amount */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3
            className={`text-base font-bold tracking-tight text-white ${
              isCompleted || isCancelled ? 'line-through text-slate-400' : ''
            }`}
          >
            {obligation.title}
          </h3>
          <div className="text-right shrink-0">
            <span className="text-lg font-extrabold text-white">
              {formatCurrency(obligation.amount, obligation.currency)}
            </span>
          </div>
        </div>

        {/* Description */}
        {obligation.description && (
          <p className="text-xs text-slate-400 mb-3 line-clamp-2">
            {obligation.description}
          </p>
        )}

        {/* Notes preview */}
        {obligation.notes && (
          <div className="flex items-start gap-1.5 text-xs text-slate-400 mb-3 bg-slate-950/40 p-2 rounded-lg border border-slate-800/50">
            <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-500" />
            <span className="italic line-clamp-2">{obligation.notes}</span>
          </div>
        )}
      </div>

      {/* Due date & Action buttons footer */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center space-x-1.5 text-xs text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span>{formatDate(obligation.dueDate)}</span>
          {isActive && (
            <span className="text-slate-400 font-medium">
              ({formatRelativeDeadline(obligation.dueDate)})
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          {isActive && (
            <>
              <button
                onClick={() => onComplete(obligation._id)}
                title="Mark as Completed"
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => onCancel(obligation._id)}
                title="Mark as Cancelled"
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={() => onEdit(obligation)}
            title="Edit Obligation"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(obligation._id)}
            title="Delete Obligation"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
