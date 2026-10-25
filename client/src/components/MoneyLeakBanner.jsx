import React from 'react';
import { AlertTriangle, Clock, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export const MoneyLeakBanner = ({ alerts = [], onCompleteObligation, onSelectObligation }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 flex items-center space-x-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-emerald-300">All Clear — No Imminent Money Leaks</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            None of your active obligations are overdue or expiring within the next 7 days.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Money Leak Detector
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {alerts.length} Attention Required
              </span>
            </h3>
          </div>
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline">
          Deterministic deadline and exposure warnings
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {alerts.map((alert) => {
          const isOverdue = alert.urgency === 'overdue';
          const isDueToday = alert.urgency === 'due-today';

          return (
            <div
              key={alert.obligationId}
              className={`p-4 rounded-xl border backdrop-blur-md transition-all ${
                isOverdue
                  ? 'bg-rose-950/30 border-rose-500/40 hover:border-rose-500/60 shadow-lg shadow-rose-950/30'
                  : isDueToday
                  ? 'bg-amber-950/30 border-amber-500/40 hover:border-amber-500/60'
                  : 'bg-orange-950/25 border-orange-500/30 hover:border-orange-500/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isOverdue
                        ? 'bg-rose-500/20 text-rose-400'
                        : isDueToday
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-orange-500/20 text-orange-400'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{alert.title}</span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isOverdue
                            ? 'bg-rose-500/20 text-rose-300'
                            : isDueToday
                            ? 'bg-amber-500/20 text-amber-200'
                            : 'bg-orange-500/20 text-orange-200'
                        }`}
                      >
                        {alert.urgency.replace('-', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 font-medium">{alert.reason}</p>
                  </div>
                </div>

                {alert.amount != null && (
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-white">
                      {formatCurrency(alert.amount, alert.currency)}
                    </div>
                    <span className="text-[10px] text-slate-400 block max-w-[100px] leading-tight">
                      {alert.notice}
                    </span>
                  </div>
                )}
              </div>

              {/* Suggested Action Bar */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Suggested Action:</span>
                  <span className="text-slate-300 italic">{alert.suggestedAction}</span>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => onCompleteObligation(alert.obligationId)}
                    className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 transition-colors"
                  >
                    Mark Resolved
                  </button>
                  {onSelectObligation && (
                    <button
                      onClick={() => onSelectObligation(alert.obligationId)}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title="Inspect Obligation"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
