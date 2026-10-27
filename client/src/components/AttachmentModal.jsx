import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Download, ExternalLink, Trash2, AlertCircle, Loader2, Paperclip } from 'lucide-react';
import { apiClient } from '../api/apiClient';
import { formatDate } from '../utils/formatters';

export const AttachmentModal = ({
  isOpen,
  obligation,
  onClose,
  onAttachmentChanged,
  onTriggerToast
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen || !obligation) return null;

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileChange = (e) => {
    setError('');
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must not exceed 5MB');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await apiClient.obligations.uploadAttachment(obligation._id, formData);
      if (res.success) {
        onTriggerToast({ type: 'success', message: 'Document attached successfully!' });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onAttachmentChanged();
      }
    } catch (err) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (attachmentId) => {
    setDeletingId(attachmentId);
    try {
      const res = await apiClient.obligations.deleteAttachment(obligation._id, attachmentId);
      if (res.success) {
        onTriggerToast({ type: 'success', message: 'Attachment deleted' });
        onAttachmentChanged();
      }
    } catch (err) {
      onTriggerToast({ type: 'error', message: err.message || 'Failed to delete attachment' });
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const attachments = obligation.attachments || [];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUploading) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg bg-[#121620] border border-[#293142] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#293142] bg-[#191F2B] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-[#172435] text-[#1D9BF0] border border-[#1D9BF0]/30 shadow-xs">
              <Paperclip className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#F5F7FA] tracking-tight">
                Document Attachments
              </h2>
              <p className="text-[11px] text-[#A0A8B7] truncate max-w-xs">{obligation.title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1 rounded-lg text-[#A0A8B7] hover:text-[#F5F7FA] hover:bg-[#232B3C] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Upload Form */}
          <form onSubmit={handleUpload} className="p-4 rounded-xl bg-[#191F2B] border border-[#293142] space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#F5F7FA] block">
              Attach New Document
            </span>

            {error && (
              <div className="p-3 rounded-lg bg-[#E53945]/15 border border-[#E53945]/30 text-[#E53945] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.txt"
                onChange={handleFileChange}
                disabled={isUploading}
                className="w-full text-xs text-[#A0A8B7] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-[#293142] file:text-xs file:font-semibold file:bg-[#121620] file:text-[#F5F7FA] hover:file:bg-[#232B3C] file:cursor-pointer cursor-pointer"
              />

              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-[#1D9BF0] hover:bg-[#1A8CD8] disabled:opacity-40 text-white text-xs font-semibold shadow-xs shrink-0 transition-all btn-press"
              >
                {isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>Upload</span>
              </button>
            </div>

            <span className="text-[11px] text-[#A0A8B7] block">
              Supported: PDF, JPEG, PNG, WEBP, TXT (Max 5MB) • Authenticated Cloud Storage
            </span>
          </form>

          {/* Attachments List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#A0A8B7] px-1">
              <span>Attached Documents ({attachments.length})</span>
            </div>

            {attachments.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-[#191F2B] border border-[#293142]">
                <FileText className="w-7 h-7 text-[#6B7280] mx-auto mb-2 opacity-60" />
                <p className="text-xs font-semibold text-[#F5F7FA]">No Documents Attached</p>
                <p className="text-[11px] text-[#A0A8B7] mt-0.5">
                  Attach invoices, receipts, policy documents, or warranty certificates.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#293142] rounded-xl bg-[#121620] border border-[#293142] overflow-hidden">
                {attachments.map((att) => {
                  const viewUrl = apiClient.obligations.viewAttachmentUrl(obligation._id, att._id);
                  const downloadUrl = apiClient.obligations.downloadAttachmentUrl(obligation._id, att._id);

                  return (
                    <div
                      key={att._id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#191F2B] transition-colors"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#172435] text-[#1D9BF0] flex items-center justify-center shrink-0 border border-[#1D9BF0]/30">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-[#F5F7FA] truncate max-w-[200px] sm:max-w-xs">
                            {att.originalName}
                          </h4>
                          <span className="text-[11px] text-[#A0A8B7] block">
                            {formatFileSize(att.size)} • {formatDate(att.uploadedAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <a
                          href={viewUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="View Document"
                          className="p-1.5 rounded-lg text-[#A0A8B7] hover:text-[#F5F7FA] hover:bg-[#191F2B] transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <a
                          href={downloadUrl}
                          download={att.originalName}
                          title="Download Document"
                          className="p-1.5 rounded-lg text-[#A0A8B7] hover:text-[#F5F7FA] hover:bg-[#191F2B] transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        {confirmDeleteId === att._id ? (
                          <div className="flex items-center space-x-1.5 animate-in fade-in duration-100">
                            <span className="text-[11px] text-[#E53945] font-semibold mr-1">Delete file?</span>
                            <button
                              onClick={() => handleDelete(att._id)}
                              disabled={deletingId === att._id}
                              className="px-2 py-1 rounded-md bg-[#E53945] hover:bg-[#D32F2F] text-white text-[10px] font-semibold transition-colors"
                            >
                              {deletingId === att._id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Confirm'
                              )}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={deletingId === att._id}
                              className="px-2 py-1 rounded-md bg-[#191F2B] hover:bg-[#232B3C] text-[#F5F7FA] text-[10px] font-medium border border-[#293142] transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(att._id)}
                            disabled={deletingId === att._id}
                            title="Delete Document"
                            className="p-1.5 rounded-lg text-[#A0A8B7] hover:text-[#E53945] hover:bg-[#E53945]/15 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
