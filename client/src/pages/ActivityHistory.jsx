import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import {
  History,
  Clock,
  PlusCircle,
  Edit,
  CheckCircle2,
  XCircle,
  Trash2,
  Paperclip,
  Repeat,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Filter
} from 'lucide-react';

export const ActivityHistory = () => {
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionFilter, setActionFilter] = useState('');

  const fetchActivities = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.activity.list({
        page,
        limit: 15,
        action: actionFilter || undefined
      });
      if (res.success) {
        setActivities(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load activity history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(1);
  }, [actionFilter]);

  const getActionMeta = (action) => {
    switch (action) {
      case 'created':
        return {
          icon: <PlusCircle className="w-4 h-4 text-[#25D366]" />,
          bg: 'bg-[#25D366]/20 border-[#25D366]/40 text-[#86EFAC]',
          label: 'Created'
        };
      case 'updated':
        return {
          icon: <Edit className="w-4 h-4 text-[#1D9BF0]" />,
          bg: 'bg-[#1D9BF0]/20 border-[#1D9BF0]/40 text-[#7DD3FC]',
          label: 'Updated'
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-[#25D366]" />,
          bg: 'bg-[#25D366]/20 border-[#25D366]/40 text-[#86EFAC]',
          label: 'Completed'
        };
      case 'cancelled':
        return {
          icon: <XCircle className="w-4 h-4 text-[#F59E0B]" />,
          bg: 'bg-[#F59E0B]/20 border-[#F59E0B]/40 text-[#FCD34D]',
          label: 'Cancelled'
        };
      case 'deleted':
        return {
          icon: <Trash2 className="w-4 h-4 text-[#E53945]" />,
          bg: 'bg-[#E53945]/20 border-[#E53945]/40 text-[#FCA5A5]',
          label: 'Deleted'
        };
      case 'attachment_uploaded':
        return {
          icon: <Paperclip className="w-4 h-4 text-[#7C3AED]" />,
          bg: 'bg-[#7C3AED]/20 border-[#7C3AED]/40 text-[#C4B5FD]',
          label: 'Document Added'
        };
      case 'attachment_deleted':
        return {
          icon: <Paperclip className="w-4 h-4 text-[#E53945]" />,
          bg: 'bg-[#E53945]/20 border-[#E53945]/40 text-[#FCA5A5]',
          label: 'Document Removed'
        };
      case 'recurrence_generated':
        return {
          icon: <Repeat className="w-4 h-4 text-[#0D9488]" />,
          bg: 'bg-[#0D9488]/20 border-[#0D9488]/40 text-[#5EEAD4]',
          label: 'Recurrence Scheduled'
        };
      default:
        return {
          icon: <Clock className="w-4 h-4 text-[#A0A8B7]" />,
          bg: 'bg-[#293142] border-[#3B4559] text-[#A0A8B7]',
          label: action
        };
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#293142]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA] flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-[#172435] text-[#1D9BF0] border border-[#1D9BF0]/30">
              <History className="w-5 h-5 stroke-[2.2]" />
            </span>
            Activity History & Audit Trail
          </h1>
          <p className="text-xs text-[#A0A8B7] mt-0.5">
            Immutable, timestamped audit log of obligations, attachments, and recurrence events.
          </p>
        </div>

        <button
          onClick={() => fetchActivities(pagination.page)}
          title="Refresh"
          className="p-2 rounded-lg text-[#A0A8B7] hover:text-[#F5F7FA] bg-[#191F2B] hover:bg-[#232B3C] border border-[#293142] shadow-xs transition-colors self-start sm:self-auto btn-press"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#121620] p-4 rounded-xl border border-[#293142] shadow-xs flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-[#A0A8B7]" />
          <span className="text-[#A0A8B7] font-medium">Filter by Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#191F2B] border border-[#293142] text-xs text-[#F5F7FA] font-medium focus:border-[#1D9BF0] focus:outline-none"
          >
            <option value="">All Actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="deleted">Deleted</option>
            <option value="attachment_uploaded">Document Added</option>
            <option value="attachment_deleted">Document Removed</option>
            <option value="recurrence_generated">Recurrence Scheduled</option>
          </select>
        </div>

        <span className="text-[#A0A8B7]">
          Total: <span className="text-[#F5F7FA] font-bold">{pagination.total}</span> events
        </span>
      </div>

      {/* Activity Timeline List */}
      <div className="bg-[#121620] rounded-xl border border-[#293142] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-[#191F2B] animate-pulse border border-[#293142]" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-10 h-10 text-[#6B7280] mx-auto mb-3 opacity-60" />
            <h3 className="text-sm font-bold text-[#F5F7FA]">No Activity Logged Yet</h3>
            <p className="text-xs text-[#A0A8B7] mt-1 max-w-sm mx-auto">
              Actions you perform—like creating, updating, completing, or attaching documents—will appear here in your audit trail.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#293142]">
            {activities.map((item) => {
              const meta = getActionMeta(item.action);
              return (
                <div
                  key={item._id}
                  className="p-4 sm:p-5 flex items-start gap-4 hover:bg-[#191F2B] transition-colors"
                >
                  <div className="p-2 rounded-lg bg-[#191F2B] border border-[#293142] shrink-0 mt-0.5">
                    {meta.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#F5F7FA]">
                          {item.title}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${meta.bg}`}>
                          {meta.label}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 text-[11px] text-[#A0A8B7] shrink-0">
                        <Clock className="w-3.5 h-3.5 text-[#6B7280]" />
                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#A0A8B7] mt-1 leading-relaxed">
                      {item.description}
                    </p>

                    {item.details && Object.keys(item.details).length > 0 && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap text-[11px] text-[#A0A8B7]">
                        {item.details.category && (
                          <span className="px-2 py-0.5 rounded-md bg-[#191F2B] border border-[#293142] capitalize">
                            Category: {item.details.category}
                          </span>
                        )}
                        {item.details.amount != null && (
                          <span className="px-2 py-0.5 rounded-md bg-[#191F2B] border border-[#293142]">
                            Amount: ₹{item.details.amount}
                          </span>
                        )}
                        {item.details.recurrence && item.details.recurrence !== 'none' && (
                          <span className="px-2 py-0.5 rounded-md bg-[#172435] border border-[#1D9BF0]/30 text-[#1D9BF0] font-medium capitalize">
                            {item.details.recurrence}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination controls */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-3.5 border-t border-[#293142] flex items-center justify-between text-xs text-[#A0A8B7] bg-[#191F2B]">
            <span>
              Page <span className="font-semibold text-[#F5F7FA]">{pagination.page}</span> of{' '}
              <span className="font-semibold text-[#F5F7FA]">{pagination.totalPages}</span>
            </span>

            <div className="flex items-center space-x-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchActivities(pagination.page - 1)}
                className="p-1.5 rounded-md bg-[#121620] border border-[#293142] text-[#F5F7FA] disabled:opacity-30 hover:bg-[#232B3C] transition-colors btn-press shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchActivities(pagination.page + 1)}
                className="p-1.5 rounded-md bg-[#121620] border border-[#293142] text-[#F5F7FA] disabled:opacity-30 hover:bg-[#232B3C] transition-colors btn-press shadow-xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityHistory;
