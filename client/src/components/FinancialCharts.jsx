import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';
import { formatCurrency, CATEGORY_META } from '../utils/formatters';

// Refined, accessible category colors for clean light backgrounds
const CATEGORY_COLORS = {
  subscription: '#7C3AED',
  bill: '#1D9BF0',
  purchase: '#059669',
  'return-window': '#D97706',
  warranty: '#0D9488',
  insurance: '#0284C7',
  'document-renewal': '#E11D48',
  custom: '#6B7280'
};

const CustomTooltip = ({ active, payload, label, prefix = '₹' }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-[#191F2B] border border-[#293142] p-3 rounded-lg shadow-xl">
        <p className="text-xs font-medium text-[#A0A8B7]">{label || item.name}</p>
        <p className="text-sm font-bold text-[#F5F7FA] mt-0.5">
          {prefix}{new Intl.NumberFormat('en-IN').format(item.value)}
        </p>
        {item.payload?.count !== undefined && (
          <p className="text-[11px] text-[#A0A8B7] mt-0.5">
            {item.payload.count} obligation{item.payload.count === 1 ? '' : 's'}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export const FinancialCharts = ({ obligations = [], financial = {} }) => {
  const [activeChartTab, setActiveChartTab] = useState('trend'); // 'trend' | 'breakdown' | 'forecast'

  // 1. Category Breakdown Data
  const categoryData = useMemo(() => {
    const map = {};
    obligations.forEach((obs) => {
      const cat = obs.category || 'custom';
      const amt = Number(obs.amount) || 0;
      if (!map[cat]) {
        map[cat] = {
          name: CATEGORY_META[cat]?.label || cat,
          categoryKey: cat,
          value: 0,
          count: 0
        };
      }
      map[cat].value += amt;
      map[cat].count += 1;
    });

    return Object.values(map)
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [obligations]);

  // 2. Upcoming Payment Forecast Timeline Data
  const forecastData = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const buckets = [
      { key: 'today', label: 'Due Today', amount: 0, count: 0 },
      { key: 'week', label: '1 - 7 Days', amount: 0, count: 0 },
      { key: 'fortnight', label: '8 - 14 Days', amount: 0, count: 0 },
      { key: 'month', label: '15 - 30 Days', amount: 0, count: 0 },
      { key: 'later', label: '30+ Days', amount: 0, count: 0 }
    ];

    obligations
      .filter((o) => o.status === 'active')
      .forEach((obs) => {
        if (!obs.dueDate) return;
        const target = new Date(obs.dueDate);
        target.setHours(0, 0, 0, 0);
        const diffDays = Math.round((target - now) / (1000 * 60 * 60 * 24));
        const amt = Number(obs.amount) || 0;

        if (diffDays <= 0) {
          buckets[0].amount += amt;
          buckets[0].count += 1;
        } else if (diffDays <= 7) {
          buckets[1].amount += amt;
          buckets[1].count += 1;
        } else if (diffDays <= 14) {
          buckets[2].amount += amt;
          buckets[2].count += 1;
        } else if (diffDays <= 30) {
          buckets[3].amount += amt;
          buckets[3].count += 1;
        } else {
          buckets[4].amount += amt;
          buckets[4].count += 1;
        }
      });

    return buckets;
  }, [obligations]);

  // 3. 6-Month Projected Outflow Trend Data
  const monthlyProjectionData = useMemo(() => {
    const months = [];
    const now = new Date();
    const monthlyRecurring = Number(financial?.monthlyRecurring) || 0;

    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });

      let oneTimeForMonth = 0;
      obligations.forEach((obs) => {
        if (obs.status === 'active' && obs.dueDate) {
          const due = new Date(obs.dueDate);
          if (due.getFullYear() === d.getFullYear() && due.getMonth() === d.getMonth()) {
            if (!obs.recurrence || obs.recurrence === 'none') {
              oneTimeForMonth += Number(obs.amount) || 0;
            }
          }
        }
      });

      months.push({
        month: `${monthName}`,
        projected: monthlyRecurring + oneTimeForMonth,
        recurring: monthlyRecurring,
        scheduled: oneTimeForMonth
      });
    }

    return months;
  }, [financial, obligations]);

  const totalTrackedCategoryAmt = categoryData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="bg-[#121620] border border-[#293142] rounded-xl p-6 shadow-sm space-y-6">
      {/* Chart Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#293142]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#1D9BF0]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1D9BF0]">
              Expenditure Analytics
            </span>
          </div>
          <h2 className="text-base font-bold text-[#F5F7FA] tracking-tight mt-0.5">
            Financial Liabilities & Outflow Forecast
          </h2>
          <p className="text-xs text-[#A0A8B7] mt-0.5">
            Deterministic projections and category distributions derived from your active obligations.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center bg-[#191F2B] p-1 rounded-lg border border-[#293142] text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setActiveChartTab('trend')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all duration-150 ${
              activeChartTab === 'trend'
                ? 'bg-[#121620] text-[#F5F7FA] shadow-sm font-semibold border border-[#293142]'
                : 'text-[#A0A8B7] hover:text-[#F5F7FA]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Outflow Trend</span>
          </button>
          <button
            onClick={() => setActiveChartTab('breakdown')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all duration-150 ${
              activeChartTab === 'breakdown'
                ? 'bg-[#121620] text-[#F5F7FA] shadow-sm font-semibold border border-[#293142]'
                : 'text-[#A0A8B7] hover:text-[#F5F7FA]'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Category Mix</span>
          </button>
          <button
            onClick={() => setActiveChartTab('forecast')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all duration-150 ${
              activeChartTab === 'forecast'
                ? 'bg-[#121620] text-[#F5F7FA] shadow-sm font-semibold border border-[#293142]'
                : 'text-[#A0A8B7] hover:text-[#F5F7FA]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Forecast Timeline</span>
          </button>
        </div>
      </div>

      {/* 1. Outflow Projection Trend View */}
      {activeChartTab === 'trend' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#A0A8B7] gap-2">
            <span>6-Month Deterministic Projection (Base Recurring + One-Time Commitments)</span>
            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#1D9BF0]" />
                <span className="text-[#F5F7FA] font-medium">Total Outflow</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#25D366]" />
                <span className="text-[#F5F7FA] font-medium">Recurring Base</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyProjectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D9BF0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1D9BF0" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="recurringAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#25D366" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#25D366" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  stroke="#6B7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#293142' }}
                />
                <YAxis
                  stroke="#6B7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#293142' }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="projected"
                  stroke="#1D9BF0"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#primaryAreaGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="recurring"
                  stroke="#25D366"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#recurringAreaGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 2. Category Mix Donut View */}
      {activeChartTab === 'breakdown' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="h-64 w-full relative flex items-center justify-center">
            {categoryData.length === 0 ? (
              <div className="text-center text-xs text-[#A0A8B7]">
                No financial obligations with monetary amounts recorded.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry) => (
                      <Cell
                        key={`cell-${entry.categoryKey}`}
                        fill={CATEGORY_COLORS[entry.categoryKey] || '#6B7280'}
                        stroke="#121620"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Center Total Pill */}
            {categoryData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-[#A0A8B7] uppercase font-semibold tracking-wider">
                  Total Active
                </span>
                <span className="text-base font-bold text-[#F5F7FA] mt-0.5">
                  {formatCurrency(totalTrackedCategoryAmt)}
                </span>
              </div>
            )}
          </div>

          {/* Legend and Category List */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {categoryData.map((cat) => {
              const pct = totalTrackedCategoryAmt > 0
                ? Math.round((cat.value / totalTrackedCategoryAmt) * 100)
                : 0;
              const color = CATEGORY_COLORS[cat.categoryKey] || '#6B7280';

              return (
                <div
                  key={cat.categoryKey}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#191F2B] border border-[#293142] text-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-medium text-[#F5F7FA]">{cat.name}</span>
                    <span className="text-[11px] text-[#A0A8B7]">({cat.count})</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-[#F5F7FA] block">
                      {formatCurrency(cat.value)}
                    </span>
                    <span className="text-[10px] text-[#A0A8B7] block">{pct}% of total</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Upcoming Forecast Timeline View */}
      {activeChartTab === 'forecast' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#A0A8B7]">
            <span>Scheduled Outflows Partitioned by Horizon Bucket</span>
            <span className="text-[#1D9BF0] font-medium">Active Commitments Only</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  stroke="#6B7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#293142' }}
                />
                <YAxis
                  stroke="#6B7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#293142' }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="amount"
                  radius={[4, 4, 0, 0]}
                  fill="#1D9BF0"
                >
                  {forecastData.map((entry, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={index === 0 ? '#E53945' : index === 1 ? '#F59E0B' : '#1D9BF0'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
