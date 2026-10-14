export interface CalendarGridCell {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dateStr: string;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatDateIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateDisplay(date: Date): string {
  const month = MONTH_NAMES[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

export function formatMonthYear(date: Date): string {
  const month = FULL_MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${year}`;
}

export function parseTaskDueDate(dueDateStr?: string, fallbackDate: Date = new Date()): Date {
  if (!dueDateStr) return new Date(fallbackDate);

  const trimmed = dueDateStr.trim();

  // If already standard ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  // If format "Oct 14, 2026" or parseable by standard Date.parse
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    return new Date(parsed);
  }

  // Fallback: extract single or double digit day number if present
  const match = trimmed.match(/\b([1-9]|[12][0-9]|3[01])\b/);
  if (match) {
    const day = parseInt(match[1], 10);
    const d = new Date(fallbackDate);
    d.setDate(day);
    return d;
  }

  return new Date(fallbackDate);
}

export function toInputDateValue(dateStr?: string): string {
  if (!dateStr || !dateStr.trim()) return '';
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  try {
    const parsed = parseTaskDueDate(trimmed);
    if (!isNaN(parsed.getTime())) {
      return formatDateIso(parsed);
    }
  } catch {}
  return '';
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function generateMonthGrid(year: number, monthIndex: number): CalendarGridCell[] {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const totalDays = getDaysInMonth(year, monthIndex);
  const todayIso = formatDateIso(new Date());

  // Monday = 0, ..., Sunday = 6
  let startingDay = firstDayOfMonth.getDay() - 1;
  if (startingDay === -1) startingDay = 6;

  const cells: CalendarGridCell[] = [];

  // Previous month trailing days
  const prevMonthDays = getDaysInMonth(year, monthIndex - 1);
  for (let i = startingDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const d = new Date(year, monthIndex - 1, day);
    cells.push({
      date: d,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: formatDateIso(d) === todayIso,
      dateStr: formatDateIso(d),
    });
  }

  // Current month days
  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(year, monthIndex, day);
    cells.push({
      date: d,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: formatDateIso(d) === todayIso,
      dateStr: formatDateIso(d),
    });
  }

  // Next month leading days (fill to multiple of 7, 35 or 42 cells)
  const remaining = (7 - (cells.length % 7)) % 7;
  const targetTotal = cells.length + remaining < 35 ? 35 : cells.length + remaining;
  const toAdd = targetTotal - cells.length;

  for (let day = 1; day <= toAdd; day++) {
    const d = new Date(year, monthIndex + 1, day);
    cells.push({
      date: d,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: formatDateIso(d) === todayIso,
      dateStr: formatDateIso(d),
    });
  }

  return cells;
}
