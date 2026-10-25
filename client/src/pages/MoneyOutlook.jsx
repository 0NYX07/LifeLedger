import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  AlertCircle,
  Repeat,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export const MoneyOutlook = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [recurringList, setRecurringList] = useState([]);
  const [error, setError] = useState(null);

  const fetchOutlookData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryRes, obligationsRes] = await Promise.all([
        apiClient.dashboard.getSummary(),
        apiClient.obligations.list({ status: 'active' })
      ]);

      if (summaryRes.success) {
        setSummary(summaryRes.data);
      }
      if (obligationsRes.success) {
        // Filter obligations with recurrence or known amount
        const recurring = obligationsRes.data.filter(
          (obs) => obs.recurrence && obs.recurrence !== 'none'
        );
        setRecurringList(recurring);
      }
    } catch (err) {
      setError(err.message || 'Failed to load financial outlook');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutlookData();
  }, []);

  const financial = summary?.financialSummary || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="w-6 h-6" />
            </span>
            Money Outlook & Financial Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Projection of upcoming commitments, subscriptions, and recurring costs.
          </p>
        </div>

        <button
          onClick={fetchOutlookData}
          title="Refresh Data"
          className="p-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Compliance Notice Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start space-x-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Disclaimer: </span>
          <span>{financial.label || 'Estimates based on user-entered information'}.</span>
          <span className="text-slate-400 block mt-0.5">
            Only active records explicitly marked with recurrence are projected into future estimates. Completed and cancelled records are excluded.
          </span>
        </div>
      </div>

      {/* 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Recurring */}
        <div className="glass-panel p-5 rounded-2xl border border-indigo-500/30 bg-indigo-950/20">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block">
            Monthly Recurring
          </span>
          <span className="text-2xl font-extrabold text-white mt-2 block">
            {formatCurrency(financial.monthlyRecurring)}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            Active monthly subscriptions & bills
          </span>
        </div>

        {/* Annual Commitment */}
        <div className="glass-panel p-5 rounded-2xl border border-purple-500/30 bg-purple-950/20">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400 block">
            Annual Commitment
          </span>
          <span className="text-2xl font-extrabold text-white mt-2 block">
            {formatCurrency(financial.annualEstimate)}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            (Monthly × 12) + yearly commitments
          </span>
        </div>

        {/* Next 30 Days */}
        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-amber-950/20">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
            Due in 30 Days
          </span>
          <span className="text-2xl font-extrabold text-white mt-2 block">
            {formatCurrency(financial.upcomingPayments30Days)}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            Upcoming scheduled cash obligations
          </span>
        </div>

        {/* Total Active Exposure */}
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
            Total Active Exposure
          </span>
          <span className="text-2xl font-extrabold text-white mt-2 block">
            {formatCurrency(financial.totalActiveExposure)}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            {financial.trackedRecordsWithAmount || 0} active obligations with amounts
          </span>
        </div>
      </div>

      {/* Breakdown Section: Recurring Obligations */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Repeat className="w-4 h-4 text-indigo-400" />
              Active Recurring Commitments
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              These records determine your monthly and annual projections.
            </p>
          </div>
          <Link
            to="/obligations?category=subscription"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            Manage Subscriptions
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-900/60 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recurringList.length === 0 ? (
          <div className="text-center py-10">
            <ShieldCheck className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-semibold text-slate-300">No Recurring Commitments Configured</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Add subscriptions, bills, or memberships with "Monthly" or "Yearly" recurrence to view accurate cost projections.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {recurringList.map((item) => (
              <div
                key={item._id}
                className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-900/40 px-3 rounded-xl transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="capitalize">{item.category}</span>
                      <span>•</span>
                      <span>Next: {formatDate(item.dueDate)}</span>
                      <span>•</span>
                      <span className="text-indigo-400 font-medium capitalize">
                        {item.recurrence} recurring
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-white">
                    {formatCurrency(item.amount, item.currency)}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    per {item.recurrence === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
