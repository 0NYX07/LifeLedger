import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { ObligationCard } from '../components/ObligationCard';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  Search,
  Filter,
  Plus,
  RotateCcw,
  ListFilter,
  ArrowUpDown,
  Calendar,
  AlertCircle,
  Inbox
} from 'lucide-react';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'bill', label: 'Bill / Utility' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'return-window', label: 'Return Window' },
  { value: 'warranty', label: 'Warranty' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'document-renewal', label: 'Document Renewal' },
  { value: 'custom', label: 'Custom' }
];

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const URGENCIES = [
  { value: '', label: 'All Urgencies' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'due-today', label: 'Due Today' },
  { value: 'due-soon', label: 'Due Soon (≤7d)' },
  { value: 'upcoming', label: 'Upcoming' }
];

export const Obligations = ({ onOpenNewModal, onEditObligation, onTriggerToast, refreshKey = 0 }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [urgency, setUrgency] = useState(searchParams.get('urgency') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'dueDate');

  const [obligations, setObligations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal confirmation state
  const [confirmAction, setConfirmAction] = useState(null);

  const fetchObligations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.obligations.list({
        search,
        category,
        status,
        urgency,
        sort
      });
      if (res.success) {
        setObligations(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch obligations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObligations();

    // Sync state with URL search params
    const newParams = {};
    if (search) newParams.search = search;
    if (category) newParams.category = category;
    if (status) newParams.status = status;
    if (urgency) newParams.urgency = urgency;
    if (sort !== 'dueDate') newParams.sort = sort;
    setSearchParams(newParams, { replace: true });
  }, [search, category, status, urgency, sort, refreshKey]);

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setStatus('');
    setUrgency('');
    setSort('dueDate');
  };

  const handleComplete = async (id) => {
    try {
      const res = await apiClient.obligations.complete(id);
      if (res.success) {
        onTriggerToast({ type: 'success', message: 'Obligation marked as completed' });
        fetchObligations();
      }
    } catch (err) {
      onTriggerToast({ type: 'error', message: err.message || 'Failed to complete obligation' });
    }
  };

  const handleCancel = (id) => {
    setConfirmAction({
      type: 'cancel',
      id,
      title: 'Cancel Obligation?',
      message: 'This will move the obligation to cancelled status. It will no longer show up as active.',
      confirmText: 'Yes, Cancel Obligation',
      variant: 'warning',
      action: async () => {
        try {
          const res = await apiClient.obligations.cancel(id);
          if (res.success) {
            onTriggerToast({ type: 'success', message: 'Obligation cancelled' });
            fetchObligations();
          }
        } catch (err) {
          onTriggerToast({ type: 'error', message: err.message || 'Failed to cancel obligation' });
        }
      }
    });
  };

  const handleDelete = (id) => {
    setConfirmAction({
      type: 'delete',
      id,
      title: 'Permanently Delete Obligation?',
      message: 'This action cannot be undone. Are you sure you want to permanently delete this record?',
      confirmText: 'Delete Obligation',
      variant: 'danger',
      action: async () => {
        try {
          const res = await apiClient.obligations.delete(id);
          if (res.success) {
            onTriggerToast({ type: 'success', message: 'Obligation deleted successfully' });
            fetchObligations();
          }
        } catch (err) {
          onTriggerToast({ type: 'error', message: err.message || 'Failed to delete obligation' });
        }
      }
    });
  };

  const hasActiveFilters = Boolean(search || category || status || urgency || sort !== 'dueDate');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            All Obligations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Search, filter, and take action on your obligations.
          </p>
        </div>

        <button
          onClick={onOpenNewModal}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Obligation</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, description, notes..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {STATUSES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          {/* Urgency Filter */}
          <div>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {URGENCIES.map((ug) => (
                <option key={ug.value} value={ug.value}>
                  {ug.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort & Reset Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center space-x-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent border-0 text-indigo-400 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="dueDate" className="bg-slate-900 text-white">Due Date (Earliest First)</option>
              <option value="-dueDate" className="bg-slate-900 text-white">Due Date (Latest First)</option>
              <option value="-amount" className="bg-slate-900 text-white">Amount (Highest First)</option>
              <option value="amount" className="bg-slate-900 text-white">Amount (Lowest First)</option>
              <option value="createdAt" className="bg-slate-900 text-white">Recently Added</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center space-x-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <span className="font-bold text-white">{obligations.length}</span> obligation
          {obligations.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Obligations Grid / Empty / Loading */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-slate-900/60 rounded-2xl border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : obligations.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">No Obligations Found</h3>
          <p className="text-sm text-slate-400 mt-2">
            {hasActiveFilters
              ? 'No records match your selected search query or filter criteria. Try clearing filters.'
              : 'You do not have any obligations recorded yet. Start tracking subscriptions, warranties, and bills.'}
          </p>
          <div className="mt-6 flex items-center justify-center space-x-3">
            {hasActiveFilters ? (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={onOpenNewModal}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30"
              >
                + Create Obligation
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {obligations.map((obs) => (
            <ObligationCard
              key={obs._id}
              obligation={obs}
              onEdit={onEditObligation}
              onComplete={handleComplete}
              onCancel={handleCancel}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmModal
          isOpen={true}
          title={confirmAction.title}
          message={confirmAction.message}
          confirmText={confirmAction.confirmText}
          confirmVariant={confirmAction.variant}
          onConfirm={() => {
            confirmAction.action();
            setConfirmAction(null);
          }}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
};
