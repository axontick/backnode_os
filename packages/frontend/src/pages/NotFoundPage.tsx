import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#09090b] text-zinc-100 p-6 select-none font-sans">
      <div className="flex flex-col items-center max-w-md text-center">
        <div className="w-14 h-14 rounded-[6px] bg-orange-950/40 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-4 shadow-[0_0_25px_rgba(234,88,12,0.15)]">
          <span className="material-symbols-outlined text-3xl">near_me_disabled</span>
        </div>
        <span className="font-mono text-xs uppercase tracking-wider text-orange-500 font-semibold mb-1">
          404 Error • Path Not Found
        </span>
        <h1 className="text-xl font-bold text-zinc-100 mb-2 font-headline">
          Page Does Not Exist
        </h1>
        <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
          The route you navigated to has been migrated, deleted, or does not exist in the Backnode OS mesh.
        </p>
        <Link
          to="/dashboard"
          className="px-4 py-2 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Return to Main Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
