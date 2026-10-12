import React from 'react';
import { Repeat } from 'lucide-react';

export type RecurrenceCadence = 'daily' | 'weekly' | 'biweekly' | 'monthly';

interface RecurringCadenceSelectorProps {
  isRecurring: boolean;
  cadence?: string;
  onToggle: (isRecurring: boolean) => void;
  onCadenceChange: (cadence: RecurrenceCadence) => void;
  className?: string;
}

export const RecurringCadenceSelector: React.FC<RecurringCadenceSelectorProps> = ({
  isRecurring,
  cadence = 'weekly',
  onToggle,
  onCadenceChange,
  className = '',
}) => {
  const options: { id: RecurrenceCadence; label: string }[] = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'biweekly', label: 'Bi-weekly' },
    { id: 'monthly', label: 'Monthly' },
  ];

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => onToggle(e.target.checked)}
            className="w-4 h-4 rounded-[4px] accent-orange-600 bg-[#18181b] border-[#27272a] focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
          <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
            <Repeat className="w-3.5 h-3.5 text-orange-500" />
            Recurring Task
          </span>
        </label>
        {isRecurring && (
          <span className="font-mono text-[10px] text-orange-400 bg-orange-950/40 border border-orange-500/30 px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider">
            Auto-renews
          </span>
        )}
      </div>

      {isRecurring && (
        <div className="flex items-center gap-1.5 pt-1">
          {options.map((opt) => {
            const isSelected = (cadence || 'weekly').toLowerCase() === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onCadenceChange(opt.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-[6px] transition-all ${
                  isSelected
                    ? 'bg-orange-600 text-white font-semibold shadow-sm'
                    : 'bg-[#18181b] border border-[#27272a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
