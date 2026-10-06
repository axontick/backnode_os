import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, login, signup } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupAccountName, setSignupAccountName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Status & error states
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleQuickDemoLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login({
        email: 'alex@backnode.io',
        password: 'Password123!',
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Quick demo login failed';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setError('Please provide both email and password.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await login({
        email: loginEmail.trim(),
        password: loginPassword,
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupAccountName || !signupEmail || !signupPassword) {
      setError('All fields are required.');
      return;
    }
    if (signupPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await signup({
        name: signupName.trim(),
        accountName: signupAccountName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setIsAuthModalOpen(false)}
    >
      <div
        className="w-full max-w-md bg-[#16171d] text-[#e8e5ec] border border-[#3b3445] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#2d2938] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#9900c2] to-[#670085] flex items-center justify-center text-white font-mono font-bold shadow-md shadow-[#9900c2]/20">
              ⚡
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-wide">Backnode OS</h2>
              <p className="text-xs text-[#9d93a5]">Operator Access & Identity Matrix</p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#282633] text-[#8e8597] hover:text-white transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Quick Demo Login Pill */}
        <div className="px-6 pt-4">
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={isSubmitting}
            className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-[#9900c2]/20 via-[#401f5c]/40 to-[#9900c2]/20 border border-[#9900c2]/50 hover:border-[#b731e0] text-[#f4effa] text-xs font-medium flex items-center justify-between transition-all hover:bg-[#9900c2]/30 active:scale-[0.99] group shadow-inner"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-white">Quick Demo Login</span>
              <span className="text-[#a59aaf] text-[11px]">(Alex Wong • OWNER)</span>
            </div>
            <span className="text-[11px] font-mono text-[#e5b3ff] group-hover:translate-x-0.5 transition-transform">
              1-Click Sign In →
            </span>
          </button>
        </div>

        {/* Tabs: Sign In / Create Workspace */}
        <div className="flex px-6 pt-4 border-b border-[#2d2938]">
          <button
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`pb-2.5 text-xs font-semibold uppercase tracking-wider transition-colors relative mr-6 ${
              tab === 'login' ? 'text-white' : 'text-[#83788f] hover:text-[#b4aabf]'
            }`}
          >
            Sign In
            {tab === 'login' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9900c2] rounded-full"></span>
            )}
          </button>
          <button
            onClick={() => {
              setTab('signup');
              setError(null);
            }}
            className={`pb-2.5 text-xs font-semibold uppercase tracking-wider transition-colors relative ${
              tab === 'signup' ? 'text-white' : 'text-[#83788f] hover:text-[#b4aabf]'
            }`}
          >
            Create Workspace
            {tab === 'signup' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9900c2] rounded-full"></span>
            )}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs flex items-start gap-2">
            <span className="text-red-400 font-bold">⚠️</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-[11px] font-mono text-[#a59aaf] uppercase tracking-wider mb-1">
                  Operator Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="alex@backnode.io"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1e1f28] border border-[#3b3548] text-white text-xs placeholder-[#5c5468] focus:outline-none focus:border-[#9900c2] transition-colors font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#a59aaf] uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1e1f28] border border-[#3b3548] text-white text-xs placeholder-[#5c5468] focus:outline-none focus:border-[#9900c2] transition-colors font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full py-2.5 rounded-xl bg-[#9900c2] hover:bg-[#b731e0] text-white text-xs font-semibold shadow-md shadow-[#9900c2]/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <span>Authenticate Operator</span>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-[11px] font-mono text-[#a59aaf] uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Alex Wong"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1e1f28] border border-[#3b3548] text-white text-xs placeholder-[#5c5468] focus:outline-none focus:border-[#9900c2] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#a59aaf] uppercase tracking-wider mb-1">
                  Workspace / Org Name
                </label>
                <input
                  type="text"
                  value={signupAccountName}
                  onChange={(e) => setSignupAccountName(e.target.value)}
                  placeholder="Acme Operations"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1e1f28] border border-[#3b3548] text-white text-xs placeholder-[#5c5468] focus:outline-none focus:border-[#9900c2] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#a59aaf] uppercase tracking-wider mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="alex@acme.corp"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1e1f28] border border-[#3b3548] text-white text-xs placeholder-[#5c5468] focus:outline-none focus:border-[#9900c2] transition-colors font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#a59aaf] uppercase tracking-wider mb-1">
                  Password (min 8 characters)
                </label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1e1f28] border border-[#3b3548] text-white text-xs placeholder-[#5c5468] focus:outline-none focus:border-[#9900c2] transition-colors font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full py-2.5 rounded-xl bg-[#9900c2] hover:bg-[#b731e0] text-white text-xs font-semibold shadow-md shadow-[#9900c2]/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Initializing Workspace...</span>
                ) : (
                  <span>Create Account & Workspace</span>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-[#111217] border-t border-[#2d2938] flex items-center justify-between text-[10px] text-[#71677c] font-mono">
          <span>JWT-256 • TypeORM Schema Sync</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </div>
  );
};
