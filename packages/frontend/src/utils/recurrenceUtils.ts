import { RecurrenceConfig, RecurrenceCadence, RecurrenceAction } from '../types';

export const DEFAULT_RECURRENCE_CONFIG: RecurrenceConfig = {
  cadence: 'weekly',
  daysOfWeek: ['Mon'],
  dailyMode: 'all_days',
  monthlyMode: 'day_of_month',
  dayOfMonth: 1,
  daysOfMonth: [1],
  action: 'create_new',
  targetStatus: 'Backlog',
};

const getDaySuffix = (day: number): string => {
  if (day === 1 || day === 21 || day === 31) return `${day}st`;
  if (day === 2 || day === 22) return `${day}nd`;
  if (day === 3 || day === 23) return `${day}rd`;
  return `${day}th`;
};

/**
 * Parses a string rule (either structured JSON or legacy simple string) into a RecurrenceConfig.
 */
export const parseRecurrenceConfig = (rule?: string): RecurrenceConfig => {
  if (!rule) {
    return { ...DEFAULT_RECURRENCE_CONFIG };
  }

  try {
    if (rule.trim().startsWith('{')) {
      const parsed = JSON.parse(rule);
      const parsedDaysOfMonth = Array.isArray(parsed.daysOfMonth) && parsed.daysOfMonth.length > 0
        ? parsed.daysOfMonth.map((d: any) => Number(d)).filter((d: number) => d >= 1 && d <= 31).sort((a: number, b: number) => a - b)
        : (typeof parsed.dayOfMonth === 'number' && parsed.dayOfMonth >= 1 && parsed.dayOfMonth <= 31 ? [parsed.dayOfMonth] : [1]);

      return {
        cadence: (['daily', 'weekly', 'biweekly', 'monthly'].includes(parsed.cadence)
          ? parsed.cadence
          : 'weekly') as RecurrenceCadence,
        daysOfWeek: Array.isArray(parsed.daysOfWeek) && parsed.daysOfWeek.length > 0
          ? parsed.daysOfWeek
          : ['Mon'],
        dailyMode: parsed.dailyMode === 'weekdays_only' ? 'weekdays_only' : 'all_days',
        monthlyMode: parsed.monthlyMode === 'specific_date' ? 'specific_date' : 'day_of_month',
        dayOfMonth: parsedDaysOfMonth[0] || 1,
        daysOfMonth: parsedDaysOfMonth,
        specificDate: parsed.specificDate || undefined,
        action: (parsed.action === 'reset_existing' ? 'reset_existing' : 'create_new') as RecurrenceAction,
        targetStatus: parsed.targetStatus || 'Backlog',
      };
    }
  } catch (e) {
    // Ignore and fallback to legacy parsing
  }

  const clean = rule.toLowerCase().trim();
  const validCadence = (['daily', 'weekly', 'biweekly', 'monthly'].includes(clean)
    ? clean
    : 'weekly') as RecurrenceCadence;

  return {
    ...DEFAULT_RECURRENCE_CONFIG,
    cadence: validCadence,
  };
};

/**
 * Serializes a RecurrenceConfig into a JSON string to persist in task.recurrenceRule.
 */
export const serializeRecurrenceConfig = (config: RecurrenceConfig): string => {
  return JSON.stringify(config);
};

/**
 * Returns a human-friendly single-line label for displaying in badges and task views.
 */
export const formatRecurrenceLabel = (rule?: string): string => {
  if (!rule) return 'Weekly';
  const cfg = parseRecurrenceConfig(rule);
  const actionSummary =
    cfg.action === 'create_new'
      ? `Create in ${cfg.targetStatus}`
      : `Reset to ${cfg.targetStatus}`;

  if (cfg.cadence === 'daily') {
    const dailyType = cfg.dailyMode === 'weekdays_only' ? 'Weekdays (Mon-Fri)' : 'Daily';
    return `${dailyType} • ${actionSummary}`;
  }

  if (cfg.cadence === 'weekly') {
    const days = cfg.daysOfWeek && cfg.daysOfWeek.length > 0 ? cfg.daysOfWeek.join(', ') : 'Mon';
    return `Weekly (${days}) • ${actionSummary}`;
  }

  if (cfg.cadence === 'biweekly') {
    const days = cfg.daysOfWeek && cfg.daysOfWeek.length > 0 ? cfg.daysOfWeek.join(', ') : 'Mon';
    return `Bi-weekly (${days}) • ${actionSummary}`;
  }

  if (cfg.cadence === 'monthly') {
    if (cfg.monthlyMode === 'specific_date' && cfg.specificDate) {
      return `Monthly (${cfg.specificDate}) • ${actionSummary}`;
    }
    const daysList = cfg.daysOfMonth && cfg.daysOfMonth.length > 0 ? cfg.daysOfMonth : [cfg.dayOfMonth || 1];
    const formattedDays = daysList.map(getDaySuffix).join(', ');
    return `Monthly (${formattedDays}) • ${actionSummary}`;
  }

  return `Recurring • ${actionSummary}`;
};

/**
 * Computes the next calendar due date based on the task's recurrence rule.
 */
export const calculateNextDueDate = (
  currentDueDate?: string,
  config?: RecurrenceConfig
): string => {
  const cfg = config || DEFAULT_RECURRENCE_CONFIG;
  const baseDate = currentDueDate ? new Date(currentDueDate) : new Date();
  const safeDate = isNaN(baseDate.getTime()) ? new Date() : baseDate;

  const next = new Date(safeDate);

  if (cfg.cadence === 'daily') {
    if (cfg.dailyMode === 'weekdays_only') {
      // Add 1 day, then if Saturday -> Monday, Sunday -> Monday
      next.setDate(next.getDate() + 1);
      const day = next.getDay();
      if (day === 6) next.setDate(next.getDate() + 2); // Saturday -> Monday
      if (day === 0) next.setDate(next.getDate() + 1); // Sunday -> Monday
    } else {
      next.setDate(next.getDate() + 1);
    }
  } else if (cfg.cadence === 'weekly') {
    next.setDate(next.getDate() + 7);
  } else if (cfg.cadence === 'biweekly') {
    next.setDate(next.getDate() + 14);
  } else if (cfg.cadence === 'monthly') {
    if (cfg.monthlyMode === 'specific_date' && cfg.specificDate) {
      const parsedSpecific = new Date(cfg.specificDate);
      if (!isNaN(parsedSpecific.getTime())) {
        next.setFullYear(parsedSpecific.getFullYear(), parsedSpecific.getMonth() + 1, parsedSpecific.getDate());
      } else {
        next.setMonth(next.getMonth() + 1);
      }
    } else {
      const days = (cfg.daysOfMonth && cfg.daysOfMonth.length > 0 ? cfg.daysOfMonth : [cfg.dayOfMonth || 1]).sort((a, b) => a - b);
      const currentDay = safeDate.getDate();
      const upcomingDayThisMonth = days.find((d) => d > currentDay);

      if (upcomingDayThisMonth) {
        const maxDaysThisMonth = new Date(safeDate.getFullYear(), safeDate.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(upcomingDayThisMonth, maxDaysThisMonth));
      } else {
        // Move to next month and use earliest day
        next.setMonth(next.getMonth() + 1);
        const earliestDay = days[0] || 1;
        const maxDaysNextMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(earliestDay, maxDaysNextMonth));
      }
    }
  }

  // Format YYYY-MM-DD
  const yyyy = next.getFullYear();
  const mm = String(next.getMonth() + 1).padStart(2, '0');
  const dd = String(next.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
