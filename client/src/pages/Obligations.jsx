import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { ObligationCard } from '../components/ObligationCard';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  Search,
  Plus,
  RotateCcw,
  ArrowUpDown,
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

export const Obligations = ({
  onOpenNewModal,
  onEditObligation,
  onManageAttachments,
  onTriggerToast,
  refreshKey = 0
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [urgency, setUrgency] = useState(searchParams.get('urgency') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'dueDate');

  const [obligations, setObligations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      title: 'Delete Obligation?',
      message: 'This action is irreversible and permanently removes the obligation and associated attachments.',
      confirmText: 'Delete Permanently',
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-[#293142]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA]">
            All Obligations
          </h1>
          <p className="text-xs text-[#A0A8B7] mt-0.5">
            Search, filter, track recurring schedules, and manage attachments.
          </p>
        </div>

        <button
          onClick={onOpenNewModal}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white text-xs font-semibold shadow-xs btn-press transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Obligation</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#121620] p-4 rounded-xl border border-[#293142] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, description, notes..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#191F2B] border border-[#293142] text-xs text-[#F5F7FA] placeholder-[#6B7280] focus:border-[#1D9BF0] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]/15"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-[#191F2B] border border-[#293142] text-xs text-[#F5F7FA] font-medium focus:border-[#1D9BF0] focus:outline-none"
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
              className="w-full px-3 py-1.5 rounded-lg bg-[#191F2B] border border-[#293142] text-xs text-[#F5F7FA] font-medium focus:border-[#1D9BF0] focus:outline-none"
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
              className="w-full px-3 py-1.5 rounded-lg bg-[#191F2B] border border-[#293142] text-xs text-[#F5F7FA] font-medium focus:border-[#1D9BF0] focus:outline-none"
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
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#293142] text-xs">
          <div className="flex items-center space-x-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#A0A8B7]" />
            <span className="text-[#A0A8B7] font-medium">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent border-0 text-[#1D9BF0] font-semibold focus:outline-none cursor-pointer"
            >
              <option value="dueDate">Due Date (Earliest First)</option>
              <option value="-dueDate">Due Date (Latest First)</option>
              <option value="-amount">Amount (Highest First)</option>
              <option value="amount">Amount (Lowest First)</option>
              <option value="createdAt">Recently Added</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center space-x-1.5 text-[#A0A8B7] hover:text-[#F5F7FA] font-medium transition-colors btn-press"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-[#A0A8B7] px-1">
        <span>
          Showing <span className="font-semibold text-[#F5F7FA]">{obligations.length}</span> obligation
          {obligations.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Obligations Grid / Empty / Loading */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-xl bg-[#191F2B] animate-pulse border border-[#293142]" />
          ))}
        </div>
      ) : obligations.length === 0 ? (
        <div className="bg-[#121620] p-12 rounded-xl border border-[#293142] shadow-xs text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-xl bg-[#172435] text-[#1D9BF0] flex items-center justify-center mx-auto mb-3 border border-[#1D9BF0]/30">
            <Inbox className="w-6 h-6 stroke-[2]" />
          </div>
          <h3 className="text-sm font-bold text-[#F5F7FA]">No Obligations Found</h3>
          <p className="text-xs text-[#A0A8B7] mt-1.5 leading-relaxed">
            {hasActiveFilters
              ? 'No records match your selected search query or filter criteria. Try resetting filters.'
              : 'You do not have any obligations recorded yet. Start tracking subscriptions, warranties, and bills.'}
          </p>
          <div className="mt-5 flex items-center justify-center space-x-2.5">
            {hasActiveFilters ? (
              <button
                onClick={handleClearFilters}
                className="px-3.5 py-1.5 rounded-lg bg-[#191F2B] hover:bg-[#232B3C] text-[#F5F7FA] border border-[#293142] text-xs font-semibold transition-colors btn-press"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={onOpenNewModal}
                className="px-4 py-2 rounded-lg bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white text-xs font-semibold shadow-xs transition-colors btn-press"
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
              onManageAttachments={onManageAttachments}
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
