import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from './NotificationBell';
import {
  LayoutDashboard,
  ListTodo,
  TrendingUp,
  History,
  Plus,
  LogOut,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';

export const Navbar = ({ onOpenNewModal }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Pure navigation links: Motion Lab completely removed
  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/obligations', label: 'Obligations', icon: ListTodo },
    { to: '/money-outlook', label: 'Money Outlook', icon: TrendingUp },
    { to: '/activity', label: 'Activity', icon: History }
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#121620]/95 backdrop-blur-md border-b border-[#293142] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-6 sm:space-x-8">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-[#172435] border border-[#293142] flex items-center justify-center text-[#1D9BF0] group-hover:bg-[#1D9BF0] group-hover:text-white transition-all duration-150">
                <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold tracking-tight text-[#F5F7FA]">
                    LifeLedger
                  </span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.2 rounded bg-[#172435] text-[#1D9BF0] border border-[#1D9BF0]/30">
                    SaaS
                  </span>
                </div>
                <span className="text-[11px] text-[#A0A8B7] font-normal leading-none -mt-0.5 hidden sm:inline">
                  Financial OS
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            {user && (
              <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-[#293142]">
                {navLinks.map(({ to, label, icon: Icon }) => {
                  const active = isActive(to);
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                        active
                          ? 'bg-[#172435] text-[#1D9BF0] font-semibold border border-[#1D9BF0]/30'
                          : 'text-[#A0A8B7] hover:text-[#F5F7FA] hover:bg-[#191F2B] border border-transparent'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <NotificationBell />

                <button
                  onClick={onOpenNewModal}
                  className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white text-xs font-semibold shadow-sm btn-press transition-colors"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>New Obligation</span>
                </button>

                {/* User capsule */}
                <div className="hidden sm:flex items-center space-x-2.5 pl-3 border-l border-[#293142]">
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-semibold text-[#F5F7FA] leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[11px] text-[#A0A8B7] leading-tight truncate max-w-[120px]">
                      {user.email}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#172435] border border-[#1D9BF0]/30 text-[#1D9BF0] flex items-center justify-center font-bold text-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 text-[#A0A8B7] hover:text-[#E53945] hover:bg-[#E53945]/15 rounded-lg transition-colors btn-press"
                >
                  <LogOut className="w-4 h-4" />
                </button>

                {/* Mobile menu toggle */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 text-[#A0A8B7] hover:text-[#F5F7FA] rounded-lg hover:bg-[#191F2B]"
                  aria-label="Toggle navigation menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2.5">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-[#A0A8B7] hover:text-[#F5F7FA] px-3 py-1.5 rounded-lg hover:bg-[#191F2B] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white text-xs font-semibold shadow-sm btn-press transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu drawer */}
        {user && mobileMenuOpen && (
          <div className="md:hidden border-t border-[#293142] py-3 space-y-1 animate-in slide-in-from-top-1 duration-150">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-medium ${
                    active
                      ? 'bg-[#172435] text-[#1D9BF0] font-semibold border border-[#1D9BF0]/30'
                      : 'text-[#A0A8B7] hover:bg-[#191F2B] hover:text-[#F5F7FA]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
            <div className="pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenNewModal();
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white text-xs font-semibold shadow-sm"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>New Obligation</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
