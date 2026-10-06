import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

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
    <div className="min-h-screen w-screen bg-[#0b0c10] text-[#e8e5ec] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Cyber Accents & Mesh Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#9900c2]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#670085]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      ></div>

      <div className="w-full max-w-md bg-[#14151b]/95 backdrop-blur-xl border border-[#2e2a38] rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Backnode Brand */}
        <div className="px-7 pt-7 pb-5 border-b border-[#24212e] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9900c2] to-[#670085] flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-[#9900c2]/30">
                ⚡
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-white">Backnode OS</h1>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#9900c2]/20 text-[#d889ff] border border-[#9900c2]/40">
                    v1.0.0
                  </span>
                </div>
                <p className="text-xs text-[#9d93a5]">Engineering Operations & CRM Mesh</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1b1c24] border border-[#2e2a38] text-[11px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Online</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex px-7 pt-5 border-b border-[#24212e]">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors relative mr-6 ${
              tab === 'login' ? 'text-white' : 'text-[#7e7389] hover:text-[#b4aabf]'
            }`}
          >
            Operator Sign In
            {tab === 'login' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9900c2] rounded-full"></span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setError(null);
            }}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors relative ${
              tab === 'signup' ? 'text-white' : 'text-[#7e7389] hover:text-[#b4aabf]'
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
          <div className="mx-7 mt-4 p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs flex items-start gap-2 animate-in fade-in duration-150">
            <span className="text-red-400 font-bold">⚠️</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-7">
          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-mono text-[#9f94a8] uppercase tracking-wider mb-1.5">
                  Operator Work Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="operator@company.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#191a22] border border-[#342f3f] text-white text-xs placeholder-[#5c5468] focus:outline-none focus:border-[#9900c2] transition-colors font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#9f94a8] uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#191a22] border border-[#342f3f] text-white text-xs placeholder-[#5c5468] focus:outline-none focus:border-[#9900c2] transition-colors font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full py-2.5 rounded-xl bg-[#9900c2] hover:bg-[#b731e0] text-white text-xs font-semibold shadow-md shadow-[#9900c2]/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Authenticating Identity...</span>
                ) : (
                  <span>Authenticate Operator</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTab('signup');
                    setError(null);
                  }}
                  className="text-xs text-[#a59aaf] hover:text-[#d889ff] transition-colors"
                >
                  Need a new workspace? <span className="underline font-semibold">Create account</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-[11px] font-mono text-[#9f94a8] uppercase tracking-wider mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Sarah Connor"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#191a22] border border-[#342f3f] text-white text-xs placeholder-[#5c5468] focus:outline-none focus:border-[#9900c2] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#9f94a8] uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Workspace / Account Name</span>
                  <span className="text-[#a59aaf] font-normal lowercase">(names your workspace)</span>
                </label>
                <input
                  type="text"
                  value={signupAccountName}
                  onChange={(e) => setSignupAccountName(e.target.value)}
                  placeholder="Cyberdyne Operations"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#191a22] border border-[#342f3f] text-white text-xs placeholder-[#5c5468] focus:outline-none focus:border-[#9900c2] transition-colors font-medium text-[#f5e6ff]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#9f94a8] uppercase tracking-wider mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="sarah@cyberdyne.corp"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#191a22] border border-[#342f3f] text-white text-xs placeholder-[#5c5468] focus:outline-none focus:border-[#9900c2] transition-colors font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#9f94a8] uppercase tracking-wider mb-1">
                  Password (min 8 characters)
                </label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#191a22] border border-[#342f3f] text-white text-xs placeholder-[#5c5468] focus:outline-none focus:border-[#9900c2] transition-colors font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full py-2.5 rounded-xl bg-[#9900c2] hover:bg-[#b731e0] text-white text-xs font-semibold shadow-md shadow-[#9900c2]/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Provisioning Account & Launching...</span>
                ) : (
                  <span>Create Account & Enter Dashboard</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setError(null);
                  }}
                  className="text-xs text-[#a59aaf] hover:text-[#d889ff] transition-colors"
                >
                  Already have an account? <span className="underline font-semibold">Sign in</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Security Badges */}
        <div className="px-7 py-3.5 bg-[#0f1015] border-t border-[#24212e] flex items-center justify-between text-[11px] text-[#71677c] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-emerald-500">lock</span>
            <span>JWT-256 Auth</span>
          </div>
          <span>Multi-Tenant</span>
        </div>
      </div>
    </div>
  );
};
