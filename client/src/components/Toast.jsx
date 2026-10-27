import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export const Toast = ({ toast, onClose }) => {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-3 duration-150">
      <div
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl border shadow-2xl bg-[#121620] ${
          isSuccess
            ? 'border-[#25D366]/40'
            : 'border-[#E53945]/40'
        }`}
      >
        <div
          className={`p-1.5 rounded-lg shrink-0 border ${
            isSuccess
              ? 'bg-[#25D366]/15 text-[#25D366] border-[#25D366]/30'
              : 'bg-[#E53945]/15 text-[#E53945] border-[#E53945]/30'
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
        </div>
        <span className="text-xs font-semibold text-[#F5F7FA] pr-2">
          {toast.message}
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-[#6B7280] hover:text-[#F5F7FA] hover:bg-[#191F2B] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
