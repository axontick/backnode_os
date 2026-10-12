import React, { useState, useRef, useEffect } from 'react';
import { PriorityLevel } from '../types';

interface PriorityDropdownProps {
  priority: PriorityLevel;
  onChange: (priority: PriorityLevel) => void;
  disabled?: boolean;
  variant?: 'badge' | 'card';
  className?: string;
}

const PRIORITY_CONFIG: Record<
  PriorityLevel,
  {
    label: string;
    levelCode: string;
    textColor: string;
    bgColor: string;
    borderColor: string;
    dotColor: string;
    icon: string;
  }
> = {
  Urgent: {
    label: 'Urgent',
    levelCode: 'P0',
    textColor: 'text-red-400',
    bgColor: 'bg-red-950/40',
    borderColor: 'border-red-500/30 hover:border-red-500/60',
    dotColor: 'bg-red-500',
    icon: 'priority_high',
  },
  High: {
    label: 'High',
    levelCode: 'P1',
    textColor: 'text-orange-400',
    bgColor: 'bg-orange-950/40',
    borderColor: 'border-orange-500/30 hover:border-orange-500/60',
    dotColor: 'bg-orange-500',
    icon: 'keyboard_arrow_up',
  },
  Medium: {
    label: 'Medium',
    levelCode: 'P2',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-950/40',
    borderColor: 'border-amber-500/30 hover:border-amber-500/60',
    dotColor: 'bg-amber-500',
    icon: 'drag_handle',
  },
  Low: {
    label: 'Low',
    levelCode: 'P3',
    textColor: 'text-zinc-400',
    bgColor: 'bg-zinc-800/60',
    borderColor: 'border-zinc-700/50 hover:border-zinc-500/60',
    dotColor: 'bg-zinc-500',
    icon: 'keyboard_arrow_down',
  },
};

const ALL_PRIORITIES: PriorityLevel[] = ['Urgent', 'High', 'Medium', 'Low'];

export const PriorityDropdown: React.FC<PriorityDropdownProps> = ({
  priority = 'Medium',
  onChange,
  disabled = false,
  variant = 'badge',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const active = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.Medium;

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (newPriority: PriorityLevel, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (disabled) return;
    onChange(newPriority);
    setIsOpen(false);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  if (variant === 'card') {
    return (
      <div ref={containerRef} className={`relative select-none ${className}`}>
        <div
          onClick={handleToggle}
          className={`flex items-center justify-between p-2 rounded-[6px] bg-[#121214] border border-[#27272a] shadow-sm transition-all ${
            disabled ? 'cursor-default opacity-60' : 'cursor-pointer hover:border-orange-500/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${active.dotColor}`} />
            <span className={`font-mono text-xs font-semibold ${active.textColor}`}>
              {active.levelCode} • {active.label}
            </span>
          </div>
          {!disabled && (
            <span className={`material-symbols-outlined text-orange-400 text-[16px] transition-transform duration-150 ${
              isOpen ? 'rotate-180' : ''
            }`}>
              expand_more
            </span>
          )}
        </div>

        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2 py-1 text-[9.5px] font-mono text-zinc-500 uppercase tracking-wider">
              Select Priority
            </div>
            {ALL_PRIORITIES.map((p) => {
              const cfg = PRIORITY_CONFIG[p];
              const isSelected = p === priority;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={(e) => handleSelect(p, e)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-orange-950/40 text-orange-400 font-semibold'
                      : 'text-zinc-300 hover:bg-zinc-800/70 hover:text-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                    <span className="font-mono text-[11px] font-semibold text-zinc-400">
                      {cfg.levelCode}
                    </span>
                    <span className={cfg.textColor}>{cfg.label}</span>
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[15px] text-orange-400">
                      check
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Default 'badge' variant
  return (
    <div ref={containerRef} className={`relative inline-block select-none ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        title={disabled ? undefined : `Priority: ${active.label} (Click to change)`}
        className={`font-mono px-2 py-0.5 rounded-[6px] text-[10px] font-semibold inline-flex items-center justify-center gap-1 border transition-all ${
          active.textColor
        } ${active.bgColor} ${active.borderColor} ${
          disabled
            ? 'cursor-default opacity-70'
            : 'cursor-pointer hover:shadow-xs active:scale-[0.98]'
        }`}
      >
        <span>{active.label}</span>
        {!disabled && (
          <span className="material-symbols-outlined text-[11px] opacity-70">
            expand_more
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl p-1 min-w-[130px] animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-0.5 text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
            Set Priority
          </div>
          {ALL_PRIORITIES.map((p) => {
            const cfg = PRIORITY_CONFIG[p];
            const isSelected = p === priority;
            return (
              <button
                key={p}
                type="button"
                onClick={(e) => handleSelect(p, e)}
                className={`w-full flex items-center justify-between px-2 py-1 rounded-[6px] text-[11px] font-mono transition-colors cursor-pointer text-left ${
                  isSelected
                    ? 'bg-orange-950/40 text-orange-400 font-semibold'
                    : 'text-zinc-300 hover:bg-zinc-800/70 hover:text-zinc-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
                  <span className={cfg.textColor}>{cfg.label}</span>
                </div>
                {isSelected && (
                  <span className="material-symbols-outlined text-[13px] text-orange-400">
                    check
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
