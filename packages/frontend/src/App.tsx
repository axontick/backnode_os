import React from 'react';
import { useAuth } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthPage } from './pages/AuthPage';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#09090b] text-zinc-100 select-none">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-[6px] bg-orange-600 flex items-center justify-center text-white shadow-[0_0_25px_rgba(234,88,12,0.4)] animate-pulse">
              <span className="material-symbols-outlined text-white text-2xl">token</span>
            </div>
            <div className="absolute inset-0 rounded-[6px] border border-orange-500/30 animate-ping pointer-events-none" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-sm tracking-wider uppercase text-zinc-300 font-semibold font-headline">
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
      <AuthModal />
    </WorkspaceProvider>
  );
}
