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
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim() || !signupAccountName.trim() || !signupEmail.trim() || !signupPassword) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => setIsAuthModalOpen(false)}
    >
      <div
        className="w-full max-w-md bg-[#121214] text-zinc-100 border border-[#27272a] rounded-[6px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[6px] bg-orange-600 flex items-center justify-center text-white font-mono font-bold text-sm shadow-sm shadow-orange-600/20">
              ⚡
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 tracking-wide font-headline">Backnode OS</h2>
              <p className="text-xs text-zinc-400 font-body">Operator Access & Identity Matrix</p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Tabs: Login / Register */}
        <div className="flex px-6 pt-2.5 border-b border-[#27272a] bg-[#0c0a09]/50">
          <button
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors relative ${
              tab === 'login'
                ? 'text-orange-400 font-semibold border-b-2 border-orange-500 bg-orange-950/20 rounded-t-[6px]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setTab('signup');
              setError(null);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors relative ${
              tab === 'signup'
                ? 'text-orange-400 font-semibold border-b-2 border-orange-500 bg-orange-950/20 rounded-t-[6px]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-[6px] bg-red-950/60 border border-red-800/60 text-red-200 text-xs flex items-start gap-2">
            <span className="text-red-400 font-bold">⚠️</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="operator@company.com"
                  className="w-full px-3 py-2 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 text-[13px] placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 text-[13px] placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full py-2.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Logging in...</span>
                ) : (
                  <span>Login</span>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Sarah Connor"
                  className="w-full px-3 py-2 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 text-[13px] placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Workspace / Org Name
                </label>
                <input
                  type="text"
                  value={signupAccountName}
                  onChange={(e) => setSignupAccountName(e.target.value)}
                  placeholder="Acme Operations"
                  className="w-full px-3 py-2 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 text-[13px] placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="sarah@acme.corp"
                  className="w-full px-3 py-2 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 text-[13px] placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Password (min 8 characters)
                </label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 text-[13px] placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full py-2.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Registering...</span>
                ) : (
                  <span>Register</span>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-2.5 bg-[#0c0a09] border-t border-[#27272a] flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <span>JWT-256 • Multi-Tenant</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </div>
  );
};
