import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import { formatDate } from '../utils/formatters';
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
          icon: <PlusCircle className="w-4 h-4 text-emerald-400" />,
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
          label: 'Created'
        };
      case 'updated':
        return {
          icon: <Edit className="w-4 h-4 text-indigo-400" />,
          bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
          label: 'Updated'
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-teal-400" />,
          bg: 'bg-teal-500/10 border-teal-500/20 text-teal-300',
          label: 'Completed'
        };
      case 'cancelled':
        return {
          icon: <XCircle className="w-4 h-4 text-amber-400" />,
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
          label: 'Cancelled'
        };
      case 'deleted':
        return {
          icon: <Trash2 className="w-4 h-4 text-rose-400" />,
          bg: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
          label: 'Deleted'
        };
      case 'attachment_uploaded':
        return {
          icon: <Paperclip className="w-4 h-4 text-purple-400" />,
          bg: 'bg-purple-500/10 border-purple-500/20 text-purple-300',
          label: 'Document Added'
        };
      case 'attachment_deleted':
        return {
          icon: <Paperclip className="w-4 h-4 text-rose-400" />,
          bg: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
          label: 'Document Removed'
        };
      case 'recurrence_generated':
        return {
          icon: <Repeat className="w-4 h-4 text-cyan-400" />,
          bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300',
          label: 'Recurrence Scheduled'
        };
      default:
        return {
          icon: <Clock className="w-4 h-4 text-slate-400" />,
          bg: 'bg-slate-800 border-slate-700 text-slate-300',
          label: action
        };
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <History className="w-6 h-6" />
            </span>
            Activity History & Audit Trail
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Complete, timestamped log of obligations, attachments, and recurrence actions.
          </p>
        </div>

        <button
          onClick={() => fetchActivities(pagination.page)}
          title="Refresh"
          className="p-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400 font-medium">Filter by Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

        <span className="text-slate-400">
          Total: <span className="text-white font-bold">{pagination.total}</span> events
        </span>
      </div>

      {/* Activity Timeline List */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-slate-900/60 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-10 h-10 text-slate-600 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-white">No Activity Logged Yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Actions you perform—like creating, updating, completing, or attaching documents—will appear here in your audit trail.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {activities.map((item) => {
              const meta = getActionMeta(item.action);
              return (
                <div
                  key={item._id}
                  className="p-4 sm:p-5 flex items-start gap-4 hover:bg-slate-900/40 transition-colors"
                >
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0 mt-0.5 shadow-sm">
                    {meta.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white tracking-tight">
                          {item.title}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.bg}`}>
                          {meta.label}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 text-xs text-slate-500 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {item.description}
                    </p>

                    {item.details && Object.keys(item.details).length > 0 && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
                        {item.details.category && (
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 capitalize">
                            Category: {item.details.category}
                          </span>
                        )}
                        {item.details.amount != null && (
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                            Amount: ₹{item.details.amount}
                          </span>
                        )}
                        {item.details.recurrence && item.details.recurrence !== 'none' && (
                          <span className="px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 capitalize">
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
          <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-950/40">
            <span>
              Page <span className="font-bold text-white">{pagination.page}</span> of{' '}
              <span className="font-bold text-white">{pagination.totalPages}</span>
            </span>

            <div className="flex items-center space-x-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchActivities(pagination.page - 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30 hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchActivities(pagination.page + 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30 hover:bg-slate-800 transition-colors"
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
