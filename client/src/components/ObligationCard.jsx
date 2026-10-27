import React from 'react';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Repeat,
  FileText,
  Paperclip
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
  onDelete,
  onManageAttachments
}) => {
  const isCompleted = obligation.status === 'completed';
  const isCancelled = obligation.status === 'cancelled';
  const isActive = obligation.status === 'active';

  const categoryMeta = CATEGORY_META[obligation.category] || CATEGORY_META.custom;
  const urgencyMeta = URGENCY_META[obligation.urgency] || URGENCY_META.upcoming;
  const priorityMeta = PRIORITY_META[obligation.priority] || PRIORITY_META.medium;

  return (
    <div
      className={`rounded-xl p-4 sm:p-5 border flex flex-col justify-between relative bg-[#121620] transition-all shadow-xs hover:shadow-md ${
        isCompleted
          ? 'opacity-70 bg-[#121620]/60 border-[#293142]'
          : isCancelled
          ? 'opacity-60 bg-[#121620]/50 border-[#293142]'
          : obligation.urgency === 'overdue'
          ? 'border-l-4 border-l-[#E53945] border-t-[#293142] border-r-[#293142] border-b-[#293142]'
          : 'border-[#293142] hover:border-[#3B4559]'
      }`}
    >
      {/* Top badges */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${categoryMeta.bg}`}
            >
              {categoryMeta.label}
            </span>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${priorityMeta.color}`}
            >
              {priorityMeta.label}
            </span>
            {obligation.recurrence && obligation.recurrence !== 'none' && (
              <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#172435] text-[#1D9BF0] border border-[#1D9BF0]/30">
                <Repeat className="w-3 h-3 text-[#1D9BF0]" />
                <span className="capitalize">{obligation.recurrence}</span>
              </span>
            )}
          </div>

          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${urgencyMeta.bg}`}
          >
            {urgencyMeta.label}
          </span>
        </div>

        {/* Title and Amount */}
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <h3
            className={`text-sm sm:text-base font-bold tracking-tight text-[#F5F7FA] ${
              isCompleted || isCancelled ? 'line-through text-[#A0A8B7]' : ''
            }`}
          >
            {obligation.title}
          </h3>
          <div className="text-right shrink-0">
            <span className="text-base sm:text-lg font-bold text-[#F5F7FA]">
              {formatCurrency(obligation.amount, obligation.currency)}
            </span>
          </div>
        </div>

        {/* Description */}
        {obligation.description && (
          <p className="text-xs text-[#A0A8B7] mb-2.5 line-clamp-2 leading-relaxed">
            {obligation.description}
          </p>
        )}

        {/* Notes preview */}
        {obligation.notes && (
          <div className="flex items-start gap-1.5 text-xs text-[#A0A8B7] mb-2.5 bg-[#191F2B] p-2 rounded-lg border border-[#293142]">
            <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#6B7280]" />
            <span className="italic line-clamp-2 text-[11px]">{obligation.notes}</span>
          </div>
        )}
      </div>

      {/* Due date & Action buttons footer */}
      <div className="pt-3 border-t border-[#293142] flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center space-x-1.5 text-xs text-[#A0A8B7]">
          <Calendar className="w-3.5 h-3.5 text-[#1D9BF0]" />
          <span className="font-semibold text-[#F5F7FA]">{formatDate(obligation.dueDate)}</span>
          {isActive && (
            <span className="text-[#A0A8B7] text-[11px]">
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
                className="p-1.5 rounded-md text-[#A0A8B7] hover:text-[#25D366] hover:bg-[#25D366]/15 transition-colors btn-press"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => onCancel(obligation._id)}
                title="Mark as Cancelled"
                className="p-1.5 rounded-md text-[#A0A8B7] hover:text-[#F59E0B] hover:bg-[#F59E0B]/15 transition-colors btn-press"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}

          {onManageAttachments && (
            <button
              onClick={() => onManageAttachments(obligation)}
              title="Manage Attachments"
              className="relative p-1.5 rounded-md text-[#A0A8B7] hover:text-[#1D9BF0] hover:bg-[#172435] transition-colors btn-press"
            >
              <Paperclip className="w-4 h-4" />
              {obligation.attachments && obligation.attachments.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#1D9BF0] px-0.5 text-[9px] font-bold text-white">
                  {obligation.attachments.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => onEdit(obligation)}
            title="Edit Obligation"
            className="p-1.5 rounded-md text-[#A0A8B7] hover:text-[#1D9BF0] hover:bg-[#172435] transition-colors btn-press"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(obligation._id)}
            title="Delete Obligation"
            className="p-1.5 rounded-md text-[#A0A8B7] hover:text-[#E53945] hover:bg-[#E53945]/15 transition-colors btn-press"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
