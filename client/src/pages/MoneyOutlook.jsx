import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { AnimatedCounter } from '../components/AnimatedCounter';
import {
  TrendingUp,
  Repeat,
  ShieldCheck,
  RefreshCw,
  Info,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export const MoneyOutlook = ({ refreshKey = 0 }) => {
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
  }, [refreshKey]);

  const financial = summary?.financialSummary || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#293142]">
        <div>
          <div className="flex items-center space-x-2 text-xs text-[#A0A8B7]">
            <span>Deterministic Cash Outflow Analysis</span>
            <span>•</span>
            <span className="text-[#1D9BF0] font-medium">Verified Active Ledger</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA] mt-1 flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-[#172435] text-[#1D9BF0] border border-[#1D9BF0]/30">
              <TrendingUp className="w-5 h-5 stroke-[2.2]" />
            </span>
            Money Outlook
          </h1>
          <p className="text-xs text-[#A0A8B7] mt-0.5">
            Clear projections of your recurring commitments, subscription liabilities, and cash outflows.
          </p>
        </div>

        <button
          onClick={fetchOutlookData}
          title="Refresh Data"
          className="p-2 rounded-lg text-[#A0A8B7] hover:text-[#F5F7FA] bg-[#191F2B] hover:bg-[#232B3C] border border-[#293142] shadow-xs transition-colors self-start sm:self-auto btn-press"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Compliance / Deterministic Notice Banner */}
      <div className="p-4 rounded-xl bg-[#172435] border border-[#1D9BF0]/30 flex items-start space-x-3 text-xs text-[#F5F7FA]">
        <Info className="w-4 h-4 text-[#1D9BF0] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[#F5F7FA]">Deterministic Projection Rules: </span>
          <span className="text-[#A0A8B7]">{financial.label || 'Estimates based on user-entered information'}.</span>
          <span className="text-[#A0A8B7] block mt-0.5">
            Only active records explicitly marked with recurrence are projected into future estimates. Completed and cancelled records are excluded. Yearly commitments are converted to monthly equivalents without double-counting.
          </span>
        </div>
      </div>

      {/* 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Recurring */}
        <div className="bg-[#121620] border border-[#293142] p-5 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#25D366] block">
            Monthly Recurring Outflow
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-[#F5F7FA] mt-1.5 block">
            <AnimatedCounter value={financial.monthlyRecurring || 0} prefix="₹" />
          </div>
          <span className="text-[11px] text-[#A0A8B7] mt-1 block">
            Active monthly subscriptions & bills
          </span>
        </div>

        {/* Annual Commitment */}
        <div className="bg-[#121620] border border-[#293142] p-5 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#1D9BF0] block">
            Annual Commitment
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-[#F5F7FA] mt-1.5 block">
            <AnimatedCounter value={financial.annualEstimate || 0} prefix="₹" />
          </div>
          <span className="text-[11px] text-[#A0A8B7] mt-1 block">
            (Monthly × 12) + yearly commitments
          </span>
        </div>

        {/* Next 30 Days */}
        <div className="bg-[#121620] border border-[#293142] p-5 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#F59E0B] block">
            Due in 30 Days
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-[#F5F7FA] mt-1.5 block">
            <AnimatedCounter value={financial.upcomingPayments30Days || 0} prefix="₹" />
          </div>
          <span className="text-[11px] text-[#A0A8B7] mt-1 block">
            Upcoming scheduled cash obligations
          </span>
        </div>

        {/* Total Active Exposure */}
        <div className="bg-[#121620] border border-[#293142] p-5 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A0A8B7] block">
            Total Active Exposure
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-[#F5F7FA] mt-1.5 block">
            <AnimatedCounter value={financial.totalActiveExposure || 0} prefix="₹" />
          </div>
          <span className="text-[11px] text-[#A0A8B7] mt-1 block">
            {financial.trackedRecordsWithAmount || 0} active obligations with amounts
          </span>
        </div>
      </div>

      {/* Breakdown Section: Recurring Obligations */}
      <div className="bg-[#121620] border border-[#293142] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#293142]">
          <div>
            <h3 className="text-sm font-bold text-[#F5F7FA] tracking-tight flex items-center gap-2">
              <Repeat className="w-4 h-4 text-[#1D9BF0]" />
              Active Recurring Commitments
            </h3>
            <p className="text-xs text-[#A0A8B7] mt-0.5">
              These records determine your monthly and annual projections.
            </p>
          </div>
          <Link
            to="/obligations?category=subscription"
            className="text-xs text-[#1D9BF0] hover:text-[#1A8CD8] font-semibold flex items-center space-x-1"
          >
            <span>Manage Subscriptions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-[#191F2B] animate-pulse border border-[#293142]" />
            ))}
          </div>
        ) : recurringList.length === 0 ? (
          <div className="text-center py-10">
            <ShieldCheck className="w-8 h-8 text-[#6B7280] mx-auto mb-2 opacity-80" />
            <p className="text-xs font-semibold text-[#F5F7FA]">No Recurring Commitments Configured</p>
            <p className="text-[11px] text-[#A0A8B7] mt-1 max-w-sm mx-auto">
              Add subscriptions, bills, or memberships with "Monthly" or "Yearly" recurrence to view accurate cost projections.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#293142]">
            {recurringList.map((item) => {
              const monthlyEquivalent =
                item.recurrence === 'yearly'
                  ? Math.round((Number(item.amount) || 0) / 12)
                  : Number(item.amount) || 0;

              return (
                <div
                  key={item._id}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-[#191F2B] px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-[#172435] text-[#1D9BF0] flex items-center justify-center shrink-0 border border-[#1D9BF0]/30">
                      <Repeat className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#F5F7FA]">{item.title}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-[#A0A8B7] mt-0.5 flex-wrap">
                        <span className="capitalize">{item.category}</span>
                        <span>•</span>
                        <span>Next: {formatDate(item.dueDate)}</span>
                        <span>•</span>
                        <span className="text-[#1D9BF0] font-medium capitalize px-1.5 py-0.2 rounded bg-[#172435] border border-[#1D9BF0]/30 text-[10px]">
                          {item.recurrence}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-[#F5F7FA]">
                      {formatCurrency(item.amount, item.currency)}
                    </span>
                    <span className="text-[10px] text-[#A0A8B7] block">
                      ≈ {formatCurrency(monthlyEquivalent, item.currency)}/mo
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
