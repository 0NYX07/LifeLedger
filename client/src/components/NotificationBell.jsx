import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Clock, AlertTriangle, Calendar, Sparkles } from 'lucide-react';
import { apiClient } from '../api/apiClient';
import { formatDate } from '../utils/formatters';

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiClient.notifications.list();
      if (res.success) {
        setNotifications(res.data || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.warn('[Notifications] Failed to load:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Handle outside click & escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await apiClient.notifications.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[Notifications] Failed to mark read:', err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[Notifications] Failed to mark all read:', err.message);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-[#E53945]" />;
      case 'due_today':
        return <Clock className="w-4 h-4 text-[#F59E0B]" />;
      case 'due_soon':
        return <Calendar className="w-4 h-4 text-[#1D9BF0]" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#25D366]" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        title="Notifications"
        className="relative p-2 rounded-lg text-[#A0A8B7] hover:text-[#F5F7FA] hover:bg-[#191F2B] transition-colors btn-press"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E53945] px-1 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#121620] border border-[#293142] shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#293142] bg-[#191F2B] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#F5F7FA]">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#172435] text-[#1D9BF0] border border-[#1D9BF0]/30 font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-[#1D9BF0] hover:text-[#1A8CD8] font-semibold flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#293142]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center bg-[#121620]">
                <CheckCheck className="w-6 h-6 text-[#6B7280] mx-auto mb-2 opacity-70" />
                <p className="text-xs font-semibold text-[#F5F7FA]">All caught up!</p>
                <p className="text-[11px] text-[#A0A8B7] mt-0.5">
                  No pending deadline alerts or reminders.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    notif.isRead
                      ? 'bg-[#121620] hover:bg-[#191F2B] opacity-80'
                      : 'bg-[#172435]/60 hover:bg-[#172435]'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-[#191F2B] border border-[#293142] shrink-0 mt-0.5">
                    {getTypeIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-[#F5F7FA] truncate">
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#1D9BF0] shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#A0A8B7] mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-[#6B7280] mt-1 block">
                      {formatDate(notif.createdAt)}
                    </span>
                  </div>

                  {!notif.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(notif._id, e)}
                      title="Mark as read"
                      className="p-1 rounded text-[#6B7280] hover:text-[#F5F7FA] shrink-0 hover:bg-[#191F2B] transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
