import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BacknodeLogo } from '../components/BacknodeLogo';

export const AuthPage: React.FC = () => {
  const { login, signup } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup'>('login');

  // Sign in state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign up state
  const [signupName, setSignupName] = useState('');
  const [signupAccountName, setSignupAccountName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Status & error states
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const msg = err.response?.data?.message || err.message || 'Authentication failed. Please verify your credentials.';
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
      const msg = err.response?.data?.message || err.message || 'Account registration failed';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Subtle Orange Accents & Mesh Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      ></div>

      <div className="w-full max-w-md bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl overflow-hidden flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Backnode Brand */}
        <div className="px-6 pt-6 pb-4 border-b border-[#27272a] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BacknodeLogo size="md" showWordmark={false} />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold tracking-tight text-zinc-100 font-headline">Backnode OS</h1>
                  <span className="px-1.5 py-0.5 rounded-[6px] text-[10px] font-mono font-bold bg-[#18181b] text-zinc-400 border border-[#27272a]">
                    v1.0.0
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-body">Engineering Operations & CRM Mesh</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-emerald-950/40 border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Online</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex px-6 pt-3 border-b border-[#27272a] bg-[#0c0a09]/50">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors relative ${
              tab === 'login'
                ? 'text-orange-400 font-semibold border-b-2 border-orange-500 bg-orange-950/20 rounded-t-[6px]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setError(null);
            }}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors relative ${
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
          <div className="mx-6 mt-4 p-3 rounded-[6px] bg-red-950/60 border border-red-800/60 text-red-200 text-xs flex items-start gap-2 animate-in fade-in duration-150">
            <span className="text-red-400 font-bold">⚠️</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
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
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
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

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTab('signup');
                    setError(null);
                  }}
                  className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Need an account? <span className="underline font-semibold text-orange-400 hover:text-orange-300">Register</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="flex flex-col gap-3.5">
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
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Workspace / Account Name</span>
                  <span className="text-zinc-500 font-normal lowercase">(names your workspace)</span>
                </label>
                <input
                  type="text"
                  value={signupAccountName}
                  onChange={(e) => setSignupAccountName(e.target.value)}
                  placeholder="Cyberdyne Operations"
                  className="w-full px-3 py-2 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 text-[13px] placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors font-medium"
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
                  placeholder="sarah@cyberdyne.corp"
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

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setError(null);
                  }}
                  className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Already have an account? <span className="underline font-semibold text-orange-400 hover:text-orange-300">Login</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Security Badges */}
        <div className="px-6 py-2.5 bg-[#0c0a09] border-t border-[#27272a] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-emerald-500">lock</span>
            <span>JWT-256 Auth</span>
          </div>
          <span>Multi-Tenant Isolation</span>
        </div>
      </div>
    </div>
  );
};
