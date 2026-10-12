import React, { useMemo } from 'react';
import { Repeat, Calendar, RotateCcw, PlusCircle, Check, ArrowRight } from 'lucide-react';
import { RecurrenceCadence, RecurrenceAction, RecurrenceConfig, StatusDefinition } from '../../types';
import {
  parseRecurrenceConfig,
  serializeRecurrenceConfig,
  formatRecurrenceLabel,
  DEFAULT_RECURRENCE_CONFIG,
} from '../../utils/recurrenceUtils';

export interface RecurringCadenceSelectorProps {
  isRecurring: boolean;
  rule?: string;
  /** @deprecated backward-compatibility fallback */
  cadence?: string;
  onToggle: (isRecurring: boolean) => void;
  onRuleChange?: (ruleString: string) => void;
  /** @deprecated backward-compatibility fallback */
  onCadenceChange?: (cadence: RecurrenceCadence) => void;
  availableStatuses?: (StatusDefinition | string)[];
  className?: string;
  readOnly?: boolean;
}

const CADENCE_OPTIONS: { id: RecurrenceCadence; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Bi-weekly' },
  { id: 'monthly', label: 'Monthly' },
];

const DAYS_OF_WEEK = [
  { key: 'Mon', label: 'M' },
  { key: 'Tue', label: 'T' },
  { key: 'Wed', label: 'W' },
  { key: 'Thu', label: 'T' },
  { key: 'Fri', label: 'F' },
  { key: 'Sat', label: 'S' },
  { key: 'Sun', label: 'S' },
];

export const RecurringCadenceSelector: React.FC<RecurringCadenceSelectorProps> = ({
  isRecurring,
  rule,
  cadence,
  onToggle,
  onRuleChange,
  onCadenceChange,
  availableStatuses,
  className = '',
  readOnly = false,
}) => {
  const currentRuleString = rule !== undefined ? rule : (cadence || '');
  const config = useMemo(() => parseRecurrenceConfig(currentRuleString), [currentRuleString]);

  const statusList: string[] = useMemo(() => {
    if (!availableStatuses || availableStatuses.length === 0) {
      return ['Backlog', 'Todo', 'In Progress', 'In Review'];
    }
    return availableStatuses.map((s) => (typeof s === 'string' ? s : s.name));
  }, [availableStatuses]);

  const updateConfig = (patch: Partial<RecurrenceConfig>) => {
    if (readOnly) return;
    const updated: RecurrenceConfig = { ...config, ...patch };
    const serialized = serializeRecurrenceConfig(updated);
    if (onRuleChange) {
      onRuleChange(serialized);
    }
    if (onCadenceChange) {
      onCadenceChange(updated.cadence);
    }
  };

  const handleToggleDay = (day: string) => {
    if (readOnly) return;
    const current = config.daysOfWeek || ['Mon'];
    let updatedDays: string[];
    if (current.includes(day)) {
      if (current.length === 1) return; // Keep at least one selected day
      updatedDays = current.filter((d) => d !== day);
    } else {
      updatedDays = [...current, day];
    }
    updateConfig({ daysOfWeek: updatedDays });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Recurrence Toggle Header */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isRecurring}
            disabled={readOnly}
            onChange={(e) => onToggle(e.target.checked)}
            className="w-4 h-4 rounded-[4px] accent-orange-600 bg-[#18181b] border-[#27272a] focus:ring-0 focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-200">
            <Repeat className="w-3.5 h-3.5 text-orange-500" />
            Recurring Task
          </span>
        </label>
        {isRecurring && (
          <span className="font-mono text-[10px] text-orange-400 bg-orange-950/40 border border-orange-500/30 px-2 py-0.5 rounded-[6px] uppercase tracking-wider font-semibold">
            Auto-renews
          </span>
        )}
      </div>

      {isRecurring && (
        <div className="space-y-3.5 p-3 rounded-[6px] bg-[#121214] border border-[#27272a]">
          {/* Cadence Selection Pills */}
          <div>
            <div className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5">
              Cadence
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {CADENCE_OPTIONS.map((opt) => {
                const isSelected = config.cadence === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={readOnly}
                    onClick={() => updateConfig({ cadence: opt.id })}
                    className={`px-3 py-1 text-xs font-medium rounded-[6px] transition-all cursor-pointer disabled:cursor-not-allowed ${
                      isSelected
                        ? 'bg-orange-600 text-white font-semibold shadow-sm shadow-orange-950/50'
                        : 'bg-[#18181b] border border-[#27272a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cadence Details: Daily */}
          {config.cadence === 'daily' && (
            <div className="space-y-1.5 pt-1">
              <div className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
                Daily Schedule
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => updateConfig({ dailyMode: 'all_days' })}
                  className={`px-2.5 py-1.5 rounded-[6px] text-xs font-medium border text-left transition-all cursor-pointer ${
                    config.dailyMode !== 'weekdays_only'
                      ? 'bg-orange-950/40 border-orange-500/50 text-orange-200'
                      : 'bg-[#18181b] border-[#27272a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <div className="font-semibold">Every Day</div>
                  <div className="text-[10px] text-zinc-400">Monday through Sunday</div>
                </button>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => updateConfig({ dailyMode: 'weekdays_only' })}
                  className={`px-2.5 py-1.5 rounded-[6px] text-xs font-medium border text-left transition-all cursor-pointer ${
                    config.dailyMode === 'weekdays_only'
                      ? 'bg-orange-950/40 border-orange-500/50 text-orange-200'
                      : 'bg-[#18181b] border-[#27272a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <div className="font-semibold">Weekdays Only</div>
                  <div className="text-[10px] text-zinc-400">Monday through Friday</div>
                </button>
              </div>
            </div>
          )}

          {/* Cadence Details: Weekly & Bi-weekly (Day Selection) */}
          {(config.cadence === 'weekly' || config.cadence === 'biweekly') && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
                  Repeat on Days
                </span>
                <span className="text-[11px] text-zinc-400">
                  {(config.daysOfWeek || ['Mon']).join(', ')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {DAYS_OF_WEEK.map((day) => {
                  const isDaySelected = (config.daysOfWeek || ['Mon']).includes(day.key);
                  return (
                    <button
                      key={day.key}
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleToggleDay(day.key)}
                      title={day.key}
                      className={`flex-1 py-1.5 rounded-[6px] text-xs font-semibold border transition-all cursor-pointer disabled:cursor-not-allowed ${
                        isDaySelected
                          ? 'bg-orange-950/50 border-orange-500 text-orange-300 shadow-sm'
                          : 'bg-[#18181b] border-[#27272a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      {day.key}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cadence Details: Monthly */}
          {config.cadence === 'monthly' && (
            <div className="space-y-2 pt-1">
              <div className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
                Monthly Schedule
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => updateConfig({ monthlyMode: 'day_of_month' })}
                  className={`px-2.5 py-1.5 rounded-[6px] text-xs font-medium border text-left transition-all cursor-pointer ${
                    config.monthlyMode !== 'specific_date'
                      ? 'bg-orange-950/40 border-orange-500/50 text-orange-200'
                      : 'bg-[#18181b] border-[#27272a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <div className="font-semibold">Day of Month</div>
                  <div className="text-[10px] text-zinc-400">Every 1st, 15th, etc.</div>
                </button>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => updateConfig({ monthlyMode: 'specific_date' })}
                  className={`px-2.5 py-1.5 rounded-[6px] text-xs font-medium border text-left transition-all cursor-pointer ${
                    config.monthlyMode === 'specific_date'
                      ? 'bg-orange-950/40 border-orange-500/50 text-orange-200'
                      : 'bg-[#18181b] border-[#27272a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <div className="font-semibold">Specific Date</div>
                  <div className="text-[10px] text-zinc-400">Exact calendar day</div>
                </button>
              </div>

              {config.monthlyMode !== 'specific_date' ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="text-[11px] text-zinc-400 mb-1">Pick day (1–31):</div>
                    <div className="flex items-center gap-1.5">
                      {[1, 15, 28, 30].map((d) => (
                        <button
                          key={d}
                          type="button"
                          disabled={readOnly}
                          onClick={() => updateConfig({ dayOfMonth: d })}
                          className={`px-2 py-1 text-xs font-mono rounded-[6px] border transition-all cursor-pointer ${
                            (config.dayOfMonth || 1) === d
                              ? 'bg-orange-950/50 border-orange-500 text-orange-300 font-bold'
                              : 'bg-[#18181b] border-[#27272a] text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {d}th
                        </button>
                      ))}
                      <input
                        type="number"
                        min="1"
                        max="31"
                        disabled={readOnly}
                        value={config.dayOfMonth || 1}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 1 && val <= 31) {
                            updateConfig({ dayOfMonth: val });
                          }
                        }}
                        className="w-16 px-2 py-1 bg-[#18181b] border border-[#27272a] rounded-[6px] text-xs font-mono text-zinc-100 text-center focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-[11px] text-zinc-400 mb-1">Select calendar date:</div>
                  <input
                    type="date"
                    disabled={readOnly}
                    value={config.specificDate || ''}
                    onChange={(e) => updateConfig({ specificDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-[#18181b] border border-[#27272a] rounded-[6px] text-xs font-mono text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Action on Completion */}
          <div className="space-y-2 pt-2 border-t border-[#27272a]">
            <div className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
              When Task Is Completed
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                disabled={readOnly}
                onClick={() => updateConfig({ action: 'create_new' })}
                className={`p-2.5 rounded-[6px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  config.action !== 'reset_existing'
                    ? 'bg-orange-950/30 border-orange-500/50 text-zinc-100'
                    : 'bg-[#18181b] border-[#27272a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-orange-400">
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Create New Task</span>
                  </div>
                  {config.action !== 'reset_existing' && (
                    <Check className="w-3.5 h-3.5 text-orange-500" />
                  )}
                </div>
                <div className="text-[11px] text-zinc-400 leading-snug">
                  Leaves completed task closed and schedules a fresh task for the next cycle.
                </div>
              </button>

              <button
                type="button"
                disabled={readOnly}
                onClick={() => updateConfig({ action: 'reset_existing' })}
                className={`p-2.5 rounded-[6px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  config.action === 'reset_existing'
                    ? 'bg-orange-950/30 border-orange-500/50 text-zinc-100'
                    : 'bg-[#18181b] border-[#27272a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-orange-400">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Move Task Back</span>
                  </div>
                  {config.action === 'reset_existing' && (
                    <Check className="w-3.5 h-3.5 text-orange-500" />
                  )}
                </div>
                <div className="text-[11px] text-zinc-400 leading-snug">
                  Re-opens this task, advances due date, and resets subtasks.
                </div>
              </button>
            </div>

            {/* Target Status Dropdown */}
            <div className="pt-1.5 flex items-center justify-between gap-3">
              <label className="text-[11px] text-zinc-400 font-medium whitespace-nowrap">
                Place into Status:
              </label>
              <select
                disabled={readOnly}
                value={config.targetStatus || 'Backlog'}
                onChange={(e) => updateConfig({ targetStatus: e.target.value })}
                className="flex-1 max-w-[200px] px-2.5 py-1.5 bg-[#18181b] border border-[#27272a] rounded-[6px] text-xs text-zinc-100 font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {statusList.map((st) => (
                  <option key={st} value={st} className="bg-[#121214] text-zinc-200">
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Summary Preview Banner */}
          <div className="pt-1">
            <div className="flex items-center gap-2 p-2 rounded-[6px] bg-orange-950/20 border border-orange-500/20 text-xs text-orange-300">
              <Repeat className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span className="font-mono text-[11px] leading-tight">
                {formatRecurrenceLabel(serializeRecurrenceConfig(config))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
