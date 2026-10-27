import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export const MoneyLeakBanner = ({ alerts = [], onCompleteObligation, onSelectObligation }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-[#121620] border border-[#293142] p-4 sm:p-5 rounded-xl shadow-xs flex items-center space-x-3.5">
        <div className="w-9 h-9 rounded-lg bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-[#F5F7FA] uppercase tracking-wide">
            All Clear — No Imminent Money Leaks
          </h4>
          <p className="text-xs text-[#A0A8B7] mt-0.5">
            None of your active obligations are overdue or expiring within the next 7 days without attention.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-[#E53945]/15 text-[#E53945] border border-[#E53945]/30">
            <ShieldAlert className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#F5F7FA] uppercase tracking-wider flex items-center gap-2">
              Money Leak Alert
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E53945]/15 text-[#E53945] border border-[#E53945]/30">
                {alerts.length} Action Required
              </span>
            </h3>
          </div>
        </div>
        <span className="text-[11px] text-[#A0A8B7] hidden sm:inline">
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
              className={`p-4 rounded-xl border bg-[#121620] shadow-xs transition-all hover:border-[#1D9BF0]/40 ${
                isOverdue
                  ? 'border-l-4 border-l-[#E53945] border-t-[#293142] border-r-[#293142] border-b-[#293142]'
                  : 'border-l-4 border-l-[#F59E0B] border-t-[#293142] border-r-[#293142] border-b-[#293142]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      isOverdue
                        ? 'bg-[#E53945]/15 text-[#E53945]'
                        : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#F5F7FA]">{alert.title}</span>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isOverdue
                            ? 'bg-[#E53945]/15 text-[#E53945] border-[#E53945]/30'
                            : 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                        }`}
                      >
                        {alert.urgency.replace('-', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-[#A0A8B7] mt-1">{alert.reason}</p>
                  </div>
                </div>

                {alert.amount != null && (
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-[#F5F7FA]">
                      {formatCurrency(alert.amount, alert.currency)}
                    </div>
                    <span className="text-[10px] text-[#A0A8B7] block max-w-[110px] leading-tight">
                      {alert.notice}
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-3 pt-2.5 border-t border-[#293142] flex items-center justify-end space-x-2">
                <button
                  onClick={() => onSelectObligation && onSelectObligation(alert.obligationId)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium text-[#A0A8B7] hover:text-[#F5F7FA] hover:bg-[#191F2B] transition-colors btn-press"
                >
                  Review Details
                </button>
                {onCompleteObligation && (
                  <button
                    onClick={() => onCompleteObligation(alert.obligationId)}
                    className="px-3 py-1 rounded-md text-xs font-semibold bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white shadow-xs transition-colors btn-press"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
