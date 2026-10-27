import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/apiClient';
import { MoneyLeakBanner } from '../components/MoneyLeakBanner';
import { ConfirmModal } from '../components/ConfirmModal';
import { FinancialCharts } from '../components/FinancialCharts';
import { AnimatedCounter } from '../components/AnimatedCounter';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  ListTodo,
  TrendingUp,
  Plus,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Calendar,
  CreditCard,
  History,
  Repeat,
  CheckCircle,
  Edit2,
  Trash2,
  Paperclip,
  ExternalLink
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  formatRelativeDeadline,
  CATEGORY_META,
  URGENCY_META
} from '../utils/formatters';

export const Dashboard = ({
  onOpenNewModal,
  onEditObligation,
  onManageAttachments,
  onTriggerToast,
  refreshKey = 0
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [allObligations, setAllObligations] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [error, setError] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumRes, obsRes, actRes] = await Promise.all([
        apiClient.dashboard.getSummary(),
        apiClient.obligations.list(),
        apiClient.activity.list({ limit: 5 }).catch(() => ({ success: false, data: [] }))
      ]);

      if (sumRes.success) {
        setSummary(sumRes.data);
      }
      if (obsRes.success) {
        setAllObligations(obsRes.data || []);
      }
      if (actRes.success) {
        setRecentActivities(actRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [refreshKey]);

  const handleComplete = async (id) => {
    try {
      const res = await apiClient.obligations.complete(id);
      if (res.success) {
        onTriggerToast({ type: 'success', message: 'Obligation marked as completed!' });
        fetchDashboardData();
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
            fetchDashboardData();
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
            onTriggerToast({ type: 'success', message: 'Obligation deleted' });
            fetchDashboardData();
          }
        } catch (err) {
          onTriggerToast({ type: 'error', message: err.message || 'Failed to delete obligation' });
        }
      }
    });
  };

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-[#191F2B] rounded-md" />
            <div className="h-4 w-72 bg-[#191F2B]/60 rounded-md" />
          </div>
          <div className="h-9 w-32 bg-[#191F2B] rounded-md" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-[#121620] border border-[#293142] rounded-xl" />
          ))}
        </div>
        <div className="h-72 bg-[#121620] border border-[#293142] rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="inline-flex p-3 rounded-xl bg-[#E53945]/15 text-[#E53945] mb-3 border border-[#E53945]/30">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#F5F7FA]">Unable to Load Financial Overview</h2>
        <p className="text-xs text-[#A0A8B7] mt-1 max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white text-xs font-semibold shadow-xs transition-colors btn-press"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const counts = summary?.counts || {};
  const financial = summary?.financialSummary || {};
  const overdueList = summary?.overdueList || [];
  const upcomingList = summary?.upcomingList || [];
  const moneyLeakAlerts = summary?.moneyLeakAlerts || [];

  // Dedicated recurring commitments list (active records with recurrence)
  const recurringObligations = allObligations.filter(
    (o) => o.status === 'active' && o.recurrence && o.recurrence !== 'none'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ========================================================
          Section A: Page Heading
          ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#293142]">
        <div>
          <div className="flex items-center space-x-2 text-xs text-[#A0A8B7]">
            <span>{todayFormatted}</span>
            <span>•</span>
            <span className="text-[#1D9BF0] font-medium">Verified Active Ledger</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA] mt-1">
            Financial Overview
          </h1>
          <p className="text-xs text-[#A0A8B7] mt-0.5">
            Clear tracking of your obligations, recurring commitments, and upcoming liabilities.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchDashboardData}
            title="Refresh Data"
            className="p-2 rounded-lg text-[#A0A8B7] hover:text-[#F5F7FA] bg-[#191F2B] hover:bg-[#232B3C] border border-[#293142] transition-colors shadow-xs btn-press"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenNewModal}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white text-xs font-semibold shadow-xs btn-press transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Obligation</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          Section B: Key Metrics Grid
          ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Active Obligations */}
        <div className="bg-[#121620] border border-[#293142] p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#A0A8B7] block">
            Active
          </span>
          <div className="mt-1 text-2xl font-bold text-[#F5F7FA]">
            <AnimatedCounter value={counts.active || 0} />
          </div>
          <span className="text-[10px] text-[#A0A8B7] block mt-0.5">
            of {counts.total || 0} registered
          </span>
        </div>

        {/* Overdue Attention */}
        <div
          className={`p-4 rounded-xl border shadow-xs transition-colors ${
            (counts.overdue || 0) > 0
              ? 'bg-[#E53945]/15 border-[#E53945]/30'
              : 'bg-[#121620] border-[#293142]'
          }`}
        >
          <span
            className={`text-[11px] font-medium uppercase tracking-wider block ${
              (counts.overdue || 0) > 0 ? 'text-[#FCA5A5]' : 'text-[#A0A8B7]'
            }`}
          >
            Overdue
          </span>
          <div
            className={`mt-1 text-2xl font-bold ${
              (counts.overdue || 0) > 0 ? 'text-[#E53945]' : 'text-[#F5F7FA]'
            }`}
          >
            <AnimatedCounter value={counts.overdue || 0} />
          </div>
          <span className={`text-[10px] block mt-0.5 ${
            (counts.overdue || 0) > 0 ? 'text-[#FCA5A5]/80' : 'text-[#A0A8B7]'
          }`}>
            Requires resolution
          </span>
        </div>

        {/* Due Soon */}
        <div
          className={`p-4 rounded-xl border shadow-xs transition-colors ${
            (counts.dueSoon || 0) + (counts.dueToday || 0) > 0
              ? 'bg-[#F59E0B]/15 border-[#F59E0B]/30'
              : 'bg-[#121620] border-[#293142]'
          }`}
        >
          <span
            className={`text-[11px] font-medium uppercase tracking-wider block ${
              (counts.dueSoon || 0) + (counts.dueToday || 0) > 0 ? 'text-[#FCD34D]' : 'text-[#A0A8B7]'
            }`}
          >
            Due Soon
          </span>
          <div className="mt-1 text-2xl font-bold text-[#F5F7FA]">
            <AnimatedCounter value={(counts.dueToday || 0) + (counts.dueSoon || 0)} />
          </div>
          <span className={`text-[10px] block mt-0.5 ${
            (counts.dueSoon || 0) + (counts.dueToday || 0) > 0 ? 'text-[#FCD34D]/80' : 'text-[#A0A8B7]'
          }`}>
            Next 7-day horizon
          </span>
        </div>

        {/* Monthly Recurring */}
        <div className="bg-[#121620] border border-[#293142] p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#25D366] block">
            Monthly Recurring
          </span>
          <div className="mt-1 text-xl sm:text-2xl font-bold text-[#F5F7FA] truncate">
            <AnimatedCounter value={financial.monthlyRecurring || 0} prefix="₹" />
          </div>
          <span className="text-[10px] text-[#A0A8B7] block mt-0.5">
            Active subscriptions
          </span>
        </div>

        {/* Estimated Annual Commitments */}
        <div className="bg-[#121620] border border-[#293142] p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#A0A8B7] block">
            Annual Commitment
          </span>
          <div className="mt-1 text-xl sm:text-2xl font-bold text-[#F5F7FA] truncate">
            <AnimatedCounter value={financial.annualEstimate || 0} prefix="₹" />
          </div>
          <span className="text-[10px] text-[#A0A8B7] block mt-0.5">
            12-month projection
          </span>
        </div>

        {/* Upcoming 30 Days Outflow */}
        <div className="bg-[#121620] border border-[#293142] p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#1D9BF0] block">
            30-Day Outflow
          </span>
          <div className="mt-1 text-xl sm:text-2xl font-bold text-[#F5F7FA] truncate">
            <AnimatedCounter value={financial.upcomingPayments30Days || 0} prefix="₹" />
          </div>
          <span className="text-[10px] text-[#A0A8B7] block mt-0.5">
            Due in 30 days
          </span>
        </div>
      </div>

      {/* ========================================================
          Section C: Spending Analytics Suite (Recharts)
          ======================================================== */}
      <FinancialCharts obligations={allObligations} financial={financial} />

      {/* Money Leak Warnings Banner */}
      <MoneyLeakBanner
        alerts={moneyLeakAlerts}
        onCompleteObligation={handleComplete}
        onSelectObligation={(id) => {
          const obs = allObligations.find((o) => o._id === id);
          if (obs) onEditObligation(obs);
        }}
      />

      {/* ========================================================
          Section D: Upcoming Obligations (Clean Table / List)
          ======================================================== */}
      <div className="bg-[#121620] border border-[#293142] rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#293142] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#F5F7FA] tracking-tight">
              Upcoming Obligations
            </h2>
            <p className="text-xs text-[#A0A8B7] mt-0.5">
              Scheduled payment dates, urgency status, and quick execution actions.
            </p>
          </div>
          <Link
            to="/obligations"
            className="text-xs text-[#1D9BF0] hover:text-[#1A8CD8] font-semibold flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {upcomingList.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-8 h-8 text-[#6B7280] mx-auto mb-2" />
            <p className="text-xs font-semibold text-[#F5F7FA]">No Upcoming Obligations</p>
            <p className="text-[11px] text-[#A0A8B7] mt-0.5">You are completely up to date!</p>
          </div>
        ) : (
          <div className="divide-y divide-[#293142]">
            {upcomingList.slice(0, 5).map((obs) => {
              const catMeta = CATEGORY_META[obs.category] || CATEGORY_META.custom;
              const urgMeta = URGENCY_META[obs.urgency] || URGENCY_META.upcoming;

              return (
                <div
                  key={obs._id}
                  className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#191F2B] transition-colors"
                >
                  <div className="flex items-start sm:items-center space-x-3">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-[#F5F7FA]">{obs.title}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.2 rounded-full ${catMeta.bg}`}>
                          {catMeta.label}
                        </span>
                        {obs.recurrence && obs.recurrence !== 'none' && (
                          <span className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.2 rounded bg-[#172435] text-[#1D9BF0] border border-[#1D9BF0]/30">
                            <Repeat className="w-2.5 h-2.5" />
                            <span className="capitalize">{obs.recurrence}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-[#A0A8B7] mt-0.5">
                        <span>Due {formatDate(obs.dueDate)}</span>
                        <span>•</span>
                        <span>{formatRelativeDeadline(obs.dueDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4">
                    <div className="text-right">
                      <span className="text-sm font-bold text-[#F5F7FA]">
                        {formatCurrency(obs.amount, obs.currency)}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full block mt-0.5 ${urgMeta.bg}`}>
                        {urgMeta.label}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleComplete(obs._id)}
                        title="Mark as Completed"
                        className="p-1.5 rounded-md text-[#A0A8B7] hover:text-[#25D366] hover:bg-[#25D366]/15 transition-colors btn-press"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      {onManageAttachments && (
                        <button
                          onClick={() => onManageAttachments(obs)}
                          title="Manage Attachments"
                          className="relative p-1.5 rounded-md text-[#A0A8B7] hover:text-[#1D9BF0] hover:bg-[#172435] transition-colors btn-press"
                        >
                          <Paperclip className="w-4 h-4" />
                          {obs.attachments && obs.attachments.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#1D9BF0] px-0.5 text-[9px] font-bold text-white">
                              {obs.attachments.length}
                            </span>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => onEditObligation(obs)}
                        title="Edit Obligation"
                        className="p-1.5 rounded-md text-[#A0A8B7] hover:text-[#1D9BF0] hover:bg-[#172435] transition-colors btn-press"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================
          Section E: Recurring Commitments Summary
          ======================================================== */}
      <div className="bg-[#121620] border border-[#293142] rounded-xl shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#293142]">
          <div className="flex items-center space-x-2">
            <Repeat className="w-4 h-4 text-[#25D366]" />
            <h2 className="text-sm font-bold text-[#F5F7FA] tracking-tight">
              Recurring Commitments & Subscriptions
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#A0A8B7]">
            {recurringObligations.length} Active Plan{recurringObligations.length === 1 ? '' : 's'}
          </span>
        </div>

        {recurringObligations.length === 0 ? (
          <p className="text-xs text-[#A0A8B7] py-4 text-center">
            No active recurring obligations recorded. Mark recurring frequency when adding an obligation.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recurringObligations.map((obs) => {
              const monthlyEquivalent =
                obs.recurrence === 'yearly'
                  ? Math.round((Number(obs.amount) || 0) / 12)
                  : Number(obs.amount) || 0;

              return (
                <div
                  key={obs._id}
                  className="p-3.5 rounded-lg border border-[#293142] bg-[#191F2B] flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#F5F7FA] truncate">{obs.title}</h4>
                      <span className="text-[10px] text-[#A0A8B7] capitalize">
                        {obs.recurrence} billing cycle
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#F5F7FA]">
                      {formatCurrency(obs.amount, obs.currency)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#293142] flex items-center justify-between text-[11px] text-[#A0A8B7]">
                    <span>Monthly impact:</span>
                    <span className="font-semibold text-[#F5F7FA]">
                      {formatCurrency(monthlyEquivalent, obs.currency)}/mo
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================
          Section F: Recent Activity Audit Trail
          ======================================================== */}
      {recentActivities.length > 0 && (
        <div className="bg-[#121620] border border-[#293142] rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#293142]">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-[#1D9BF0]" />
              <h2 className="text-xs font-bold text-[#F5F7FA] uppercase tracking-wider">
                Recent Ledger Activity
              </h2>
            </div>
            <Link
              to="/activity"
              className="text-xs text-[#1D9BF0] hover:text-[#1A8CD8] font-semibold flex items-center space-x-1"
            >
              <span>View Audit Trail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentActivities.map((act) => (
              <div
                key={act._id}
                className="p-3 rounded-lg bg-[#191F2B] border border-[#293142] space-y-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[#F5F7FA] truncate">{act.title}</span>
                  <span className="text-[10px] text-[#1D9BF0] font-medium capitalize px-1.5 py-0.2 rounded bg-[#172435] border border-[#1D9BF0]/30">
                    {act.action?.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[11px] text-[#A0A8B7] truncate">{act.description}</p>
                <span className="text-[10px] text-[#6B7280] block pt-1">
                  {formatDate(act.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Confirmation Modal */}
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
