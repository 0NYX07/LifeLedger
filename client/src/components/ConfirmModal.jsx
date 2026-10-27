import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  confirmVariant = 'danger',
  onConfirm,
  onClose
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md bg-[#121620] border border-[#293142] rounded-xl shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-start space-x-3.5">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              confirmVariant === 'danger'
                ? 'bg-[#E53945]/15 text-[#E53945] border border-[#E53945]/30'
                : 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
            }`}
          >
            <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-[#F5F7FA] tracking-tight">{title}</h3>
            <p className="text-xs text-[#A0A8B7] mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-2.5 pt-3 border-t border-[#293142]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-[#A0A8B7] hover:text-[#F5F7FA] hover:bg-[#191F2B] transition-colors btn-press"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-xs transition-colors btn-press ${
              confirmVariant === 'danger'
                ? 'bg-[#E53945] hover:bg-[#D32F2F]'
                : 'bg-[#F59E0B] hover:bg-[#D97706]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
