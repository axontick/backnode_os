import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { pluginsApi } from '../../services/api';
import {
  MODULES_REGISTRY,
  PluginModuleDefinition,
  isFieldLinkActive,
} from '@backnode/shared';
import {
  Boxes,
  CheckCircle2,
  XCircle,
  Link2,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Layers,
  FolderOpen,
  LineChart,
  Users,
  BookOpen,
} from 'lucide-react';

export const PluginsPage: React.FC = () => {
  const { enabledPlugins, handleTogglePlugin, showToast } = useWorkspace();
  const { user, effectiveRole } = useAuth();
  const isOwnerOrAdmin = effectiveRole === 'OWNER' || effectiveRole === 'ADMIN';

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const getModuleIcon = (iconName: string) => {
    switch (iconName) {
      case 'folder_open':
        return <FolderOpen className="w-5 h-5 text-orange-500" />;
      case 'leaderboard':
        return <LineChart className="w-5 h-5 text-orange-500" />;
      case 'contacts':
        return <Users className="w-5 h-5 text-orange-500" />;
      case 'article':
      case 'book_open':
        return <BookOpen className="w-5 h-5 text-orange-500" />;
      default:
        return <Boxes className="w-5 h-5 text-orange-500" />;
    }
  };

  const handleToggle = async (module: PluginModuleDefinition) => {
    if (!isOwnerOrAdmin) {
      showToast('Permission denied: Only workspace admins can configure plugins.');
      return;
    }
    const currentEnabled = enabledPlugins[module.id] !== false;
    setTogglingId(module.id);
    try {
      await handleTogglePlugin(module.id, !currentEnabled);
    } finally {
      setTogglingId(null);
    }
  };

  const activeCount = MODULES_REGISTRY.filter(
    (m) => enabledPlugins[m.id] !== false
  ).length;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-[#09090b] text-zinc-100 p-6 md:p-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#27272a] shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-6 h-6 text-orange-500" />
            <h1 className="text-xl md:text-2xl font-bold font-headline tracking-tight text-zinc-100">
              Workspace Plugins &amp; Module Correlations
            </h1>
          </div>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Enable or disable modules dynamically. Cross-module linking options automatically adapt based on active plugins.
          </p>
        </div>

        {/* Global plugin telemetry chip */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#121214] border border-[#27272a]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-xs font-semibold text-zinc-200">
              {activeCount} of {MODULES_REGISTRY.length} Plugins Active
            </span>
          </div>
        </div>
      </div>

      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5 mt-6">
        {MODULES_REGISTRY.map((mod) => {
          const isEnabled = enabledPlugins[mod.id] !== false;
          const isToggling = togglingId === mod.id;

          return (
            <div
              key={mod.id}
              className={`bg-[#121214] border rounded-[6px] p-5 shadow-sm transition-all flex flex-col justify-between ${
                isEnabled
                  ? 'border-[#27272a] hover:border-orange-500/50'
                  : 'border-zinc-800/60 opacity-70 hover:opacity-100'
              }`}
            >
              <div>
                {/* Top Badge & Toggle Switch */}
                <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-[6px] bg-[#18181b] border border-[#27272a] flex items-center justify-center">
                      {getModuleIcon(mod.sidebarIcon)}
                    </div>
                    <div>
                      <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider block">
                        PLUGIN MODULE
                      </span>
                      <h2 className="text-base font-bold font-headline text-zinc-100">
                        {mod.name}
                      </h2>
                    </div>
                  </div>

                  {/* Toggle Control */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded-[6px] ${
                        isEnabled
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {isEnabled ? 'ACTIVE' : 'DISABLED'}
                    </span>

                    <button
                      type="button"
                      disabled={isToggling || !isOwnerOrAdmin}
                      onClick={() => handleToggle(mod)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:cursor-not-allowed ${
                        isEnabled ? 'bg-orange-600' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-300 mt-3 leading-relaxed">
                  {mod.description}
                </p>

                {/* Features Chips */}
                <div className="mt-4">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1.5">
                    Included Features
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {mod.features.map((feat) => (
                      <span
                        key={feat}
                        className="px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-[#18181b] border border-[#27272a] text-zinc-300"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Field Link Correlations */}
              <div className="mt-5 pt-3.5 border-t border-[#27272a] bg-[#18181b]/30 -mx-5 -mb-5 p-4 rounded-b-[6px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1 font-semibold">
                    <Link2 className="w-3 h-3 text-orange-500" />
                    Cross-Module Linkages ({mod.fieldLinks.length})
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    JSON Config Driven
                  </span>
                </div>

                {mod.fieldLinks.length > 0 ? (
                  <div className="space-y-1.5">
                    {mod.fieldLinks.map((link) => {
                      const isTargetActive = isFieldLinkActive(link, enabledPlugins);
                      return (
                        <div
                          key={link.id}
                          className="flex items-center justify-between px-2.5 py-1 rounded-[6px] bg-[#18181b] border border-[#27272a] text-xs"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-zinc-200 font-medium">{link.label}</span>
                            <ArrowRight className="w-3 h-3 text-zinc-500" />
                            <span className="text-zinc-400 capitalize">{link.targetModule}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            {isTargetActive ? (
                              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" />
                                Active
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400">
                                <XCircle className="w-3 h-3" />
                                Requires {link.targetModule}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[11px] text-zinc-500 italic">
                    Independent standalone module
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
