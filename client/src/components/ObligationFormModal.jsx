import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';

const CATEGORIES = [
  { value: 'subscription', label: 'Subscription' },
  { value: 'bill', label: 'Bill / Utility' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'return-window', label: 'Return Window' },
  { value: 'warranty', label: 'Warranty' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'document-renewal', label: 'Document Renewal' },
  { value: 'custom', label: 'Custom' }
];

export const ObligationFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false
}) => {
  const titleInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'custom',
    dueDate: '',
    amount: '',
    currency: 'INR',
    priority: 'medium',
    recurrence: 'none',
    description: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        category: initialData.category || 'custom',
        dueDate: initialData.dueDate ? initialData.dueDate.split('T')[0] : '',
        amount: initialData.amount != null ? initialData.amount : '',
        currency: initialData.currency || 'INR',
        priority: initialData.priority || 'medium',
        recurrence: initialData.recurrence || 'none',
        description: initialData.description || '',
        notes: initialData.notes || ''
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        title: '',
        category: 'subscription',
        dueDate: today,
        amount: '',
        currency: 'INR',
        priority: 'medium',
        recurrence: 'none',
        description: '',
        notes: ''
      });
    }
    setErrors({});

    if (isOpen) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }
    if (formData.amount !== '' && (isNaN(formData.amount) || Number(formData.amount) < 0)) {
      newErrors.amount = 'Amount must be a non-negative number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...formData,
      amount: formData.amount === '' ? null : Number(formData.amount)
    };

    onSubmit(payload);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg bg-[#121620] border border-[#293142] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#293142] bg-[#191F2B] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#1D9BF0]" />
            <h2 className="text-sm font-bold text-[#F5F7FA] tracking-tight">
              {initialData ? 'Edit Obligation' : 'Create New Obligation'}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-[#A0A8B7] hover:text-[#F5F7FA] hover:bg-[#232B3C] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
              Title <span className="text-[#E53945]">*</span>
            </label>
            <input
              ref={titleInputRef}
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Netflix, Car Insurance, Laptop Return Window"
              className={`w-full px-3.5 py-2 rounded-lg bg-[#191F2B] border text-xs text-[#F5F7FA] placeholder-[#6B7280] focus:border-[#1D9BF0] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]/20 ${
                errors.title ? 'border-[#E53945]' : 'border-[#293142]'
              }`}
            />
            {errors.title && (
              <p className="text-xs text-[#E53945] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-[#191F2B] border border-[#293142] text-xs text-[#F5F7FA] font-medium focus:border-[#1D9BF0] focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value} className="bg-[#191F2B] text-[#F5F7FA]">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-[#191F2B] border border-[#293142] text-xs text-[#F5F7FA] font-medium focus:border-[#1D9BF0] focus:outline-none"
              >
                <option value="low" className="bg-[#191F2B] text-[#F5F7FA]">Low Priority</option>
                <option value="medium" className="bg-[#191F2B] text-[#F5F7FA]">Medium Priority</option>
                <option value="high" className="bg-[#191F2B] text-[#F5F7FA]">High Priority</option>
              </select>
            </div>
          </div>

          {/* Due Date & Recurrence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                Due Date <span className="text-[#E53945]">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-lg bg-[#191F2B] border text-xs text-[#F5F7FA] focus:border-[#1D9BF0] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]/20 ${
                  errors.dueDate ? 'border-[#E53945]' : 'border-[#293142]'
                }`}
              />
              {errors.dueDate && (
                <p className="text-xs text-[#E53945] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.dueDate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                Recurrence
              </label>
              <select
                value={formData.recurrence}
                onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-[#191F2B] border border-[#293142] text-xs text-[#F5F7FA] font-medium focus:border-[#1D9BF0] focus:outline-none"
              >
                <option value="none" className="bg-[#191F2B] text-[#F5F7FA]">One-time (No Recurrence)</option>
                <option value="monthly" className="bg-[#191F2B] text-[#F5F7FA]">Monthly Recurring</option>
                <option value="yearly" className="bg-[#191F2B] text-[#F5F7FA]">Yearly Recurring</option>
              </select>
            </div>
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                Amount (Optional)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="e.g. 999"
                className={`w-full px-3.5 py-2 rounded-lg bg-[#191F2B] border text-xs text-[#F5F7FA] placeholder-[#6B7280] focus:border-[#1D9BF0] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]/20 ${
                  errors.amount ? 'border-[#E53945]' : 'border-[#293142]'
                }`}
              />
              {errors.amount && (
                <p className="text-xs text-[#E53945] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.amount}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                Currency
              </label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                placeholder="INR"
                className="w-full px-3.5 py-2 rounded-lg bg-[#191F2B] border border-[#293142] text-xs text-[#F5F7FA] font-medium focus:border-[#1D9BF0] focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Context, account reference, or purpose"
              className="w-full px-3.5 py-2 rounded-lg bg-[#191F2B] border border-[#293142] text-xs text-[#F5F7FA] placeholder-[#6B7280] focus:border-[#1D9BF0] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]/20 resize-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
              Personal Notes / Steps (Optional)
            </label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Keep box and original receipt; call support at 1800..."
              className="w-full px-3.5 py-2 rounded-lg bg-[#191F2B] border border-[#293142] text-xs text-[#F5F7FA] placeholder-[#6B7280] focus:border-[#1D9BF0] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]/20 resize-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-[#293142] flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[#A0A8B7] hover:text-[#F5F7FA] hover:bg-[#191F2B] transition-colors btn-press"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#1D9BF0] hover:bg-[#1A8CD8] disabled:opacity-50 text-white text-xs font-semibold shadow-xs btn-press transition-colors"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{initialData ? 'Save Changes' : 'Create Obligation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
