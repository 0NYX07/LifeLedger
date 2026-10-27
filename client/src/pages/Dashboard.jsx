import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { MoneyLeakBanner } from '../components/MoneyLeakBanner';
import { ObligationCard } from '../components/ObligationCard';
import { ConfirmModal } from '../components/ConfirmModal';
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
  Calendar
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export const Dashboard = ({ onOpenNewModal, onEditObligation, onTriggerToast, refreshKey = 0 }) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.dashboard.getSummary();
      if (res.success) {
        setSummary(res.data);
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
      title: 'Permanently Delete Obligation?',
      message: 'This action cannot be undone. Are you sure you want to permanently delete this record?',
      confirmText: 'Delete Obligation',
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="h-8 w-48 bg-slate-800/60 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-900/60 rounded-2xl border border-slate-800 animate-pulse" />
          ))}
        </div>
        <div className="h-44 bg-slate-900/60 rounded-2xl border border-slate-800 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="inline-flex p-4 rounded-2xl bg-rose-500/10 text-rose-400 mb-4 border border-rose-500/20">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Unable to Load Dashboard</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-6 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Obligation Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time status of your subscriptions, bills, warranties, and deadlines.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDashboardData}
            title="Refresh Data"
            className="p-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenNewModal}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Obligation</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overdue */}
        <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 bg-rose-950/20 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Overdue</span>
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{counts.overdue || 0}</span>
            <span className="text-xs text-rose-300 font-medium">Require action</span>
          </div>
        </div>

        {/* Due Today / Due Soon */}
        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-amber-950/20 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Due Soon (≤ 7 Days)</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">
              {(counts.dueToday || 0) + (counts.dueSoon || 0)}
            </span>
            <span className="text-xs text-amber-300 font-medium">
              {counts.dueToday || 0} due today
            </span>
          </div>
        </div>

        {/* Active Obligations */}
        <div className="glass-panel p-5 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Active Tracking</span>
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <ListTodo className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{counts.active || 0}</span>
            <span className="text-xs text-indigo-300 font-medium">of {counts.total || 0} total</span>
          </div>
        </div>

        {/* Completed */}
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Resolved / Closed</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{counts.completed || 0}</span>
            <span className="text-xs text-emerald-300 font-medium">
              {counts.cancelled ? `+${counts.cancelled} cancelled` : 'completed'}
            </span>
          </div>
        </div>
      </div>

      {/* Money Leak Detector */}
      <MoneyLeakBanner
        alerts={moneyLeakAlerts}
        onCompleteObligation={handleComplete}
        onSelectObligation={(id) => {
          const obs = [...overdueList, ...upcomingList].find((o) => o._id === id);
          if (obs) onEditObligation(obs);
        }}
      />

      {/* Financial Snapshot Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Financial Outlook Summary</h3>
              <p className="text-xs text-slate-400 mt-0.5">{financial.label}</p>
            </div>
          </div>
          <Link
            to="/money-outlook"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>Detailed Outlook</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-5">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Monthly Recurring Costs</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">
              {formatCurrency(financial.monthlyRecurring)}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              From active recurring records only
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block font-medium">Estimated Annual Commitment</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">
              {formatCurrency(financial.annualEstimate)}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              (Monthly × 12) + yearly commitments
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block font-medium">Upcoming Payments (30 Days)</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">
              {formatCurrency(financial.upcomingPayments30Days)}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Active obligations due within 30 days
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Overdue & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Overdue Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              Overdue Attention List
            </h3>
            <Link
              to="/obligations?urgency=overdue"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              View all
            </Link>
          </div>

          {overdueList.length === 0 ? (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-200">No Overdue Obligations</p>
              <p className="text-xs text-slate-400 mt-1">You are all caught up on your deadlines!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {overdueList.map((obs) => (
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
        </div>

        {/* Upcoming Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              Upcoming Deadlines
            </h3>
            <Link
              to="/obligations"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              View all ({counts.active || 0})
            </Link>
          </div>

          {upcomingList.length === 0 ? (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center">
              <Calendar className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-200">No Upcoming Deadlines</p>
              <p className="text-xs text-slate-400 mt-1">Add obligations to track your future schedule.</p>
              <button
                onClick={onOpenNewModal}
                className="mt-4 px-3.5 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold hover:bg-indigo-600/30 transition-colors"
              >
                + Add First Obligation
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingList.map((obs) => (
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
        </div>
      </div>

      {/* Confirmation Modal for Destructive Actions */}
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
