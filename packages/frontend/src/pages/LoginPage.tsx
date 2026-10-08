import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { BacknodeLogo } from '../components/BacknodeLogo';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const { activeUserSpaceId, userSpaces } = useWorkspace();
  const navigate = useNavigate();

  const spaceId = activeUserSpaceId || userSpaces[0]?.id || 'space-main';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to space dashboard
  if (isAuthenticated) {
    return <Navigate to={`/space/${spaceId}/dashboard`} replace />;
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await login({
        email: email.trim(),
        password,
      });
      navigate(`/space/${spaceId}/dashboard`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Authentication failed. Please verify your credentials.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      {/* Background Subtle Orange Accents & Mesh Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

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
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Online</span>
            </div>
          </div>
        </div>

        {/* Tab Header / Navigation */}
        <div className="flex px-6 pt-3 border-b border-[#27272a] bg-[#0c0a09]/50">
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-orange-400 border-b-2 border-orange-500 bg-orange-950/20 rounded-t-[6px]">
            Sign In
          </div>
          <Link
            to="/register"
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Register
          </Link>
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
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {isSubmitting ? <span>Logging in...</span> : <span>Login to Backnode OS</span>}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/register"
                className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Need an account? <span className="underline font-semibold text-orange-400 hover:text-orange-300">Register</span>
              </Link>
            </div>
          </form>
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
