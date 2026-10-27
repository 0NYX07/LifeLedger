import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-xl bg-[#172435] text-[#1D9BF0] border border-[#1D9BF0]/30 mb-3 shadow-xs">
            <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA]">
            Sign in to LifeLedger
          </h1>
          <p className="text-xs text-[#A0A8B7] mt-1">
            Personal administration, liabilities tracking, and deadline intelligence.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#121620] p-7 sm:p-8 rounded-xl border border-[#293142] shadow-xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[#E53945]/10 border border-[#E53945]/30 text-[#E53945] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#191F2B] border border-[#293142] text-xs text-[#F5F7FA] placeholder-[#6B7280] focus:border-[#1D9BF0] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 rounded-lg bg-[#191F2B] border border-[#293142] text-xs text-[#F5F7FA] placeholder-[#6B7280] focus:border-[#1D9BF0] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#6B7280] hover:text-[#F5F7FA] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white text-xs font-semibold shadow-xs flex items-center justify-center space-x-2 transition-colors btn-press mt-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#A0A8B7]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#1D9BF0] hover:text-[#1A8CD8] font-semibold">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
