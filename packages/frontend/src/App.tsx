import React from 'react';
import { useAuth } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthPage } from './pages/AuthPage';

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0d0d12] text-white select-none">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#9900c2] to-[#ff007a] animate-pulse flex items-center justify-center shadow-[0_0_30px_rgba(153,0,194,0.4)]">
              <span className="material-symbols-outlined text-white text-3xl">token</span>
            </div>
            <div className="absolute inset-0 rounded-2xl border-2 border-white/20 animate-ping pointer-events-none" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-sm tracking-wider uppercase text-zinc-400 font-semibold">
              BACKNODE OS
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              Restoring secure operator environment...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <WorkspaceProvider>
      <DashboardLayout />
    </WorkspaceProvider>
  );
}
