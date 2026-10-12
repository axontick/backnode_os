import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';

interface CalendarPopoverProps {
  value?: string;
  onChange: (dateStr: string) => void;
  onClose?: () => void;
  className?: string;
  trigger?: React.ReactNode;
}

export const CalendarPopover: React.FC<CalendarPopoverProps> = ({
  value,
  onChange,
  onClose,
  className = '',
  trigger,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial date or default to current date
  const parseDate = (dStr?: string) => {
    if (!dStr) return new Date();
    const parsed = new Date(dStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const initialDate = parseDate(value);
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        onClose?.();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const formatDateString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handleSelectDay = (day: number) => {
    const selected = new Date(year, month, day);
    onChange(formatDateString(selected));
    setIsOpen(false);
    onClose?.();
  };

  const handleQuickPreset = (preset: 'today' | 'tomorrow' | 'nextWeek' | 'clear') => {
    const today = new Date();
    if (preset === 'clear') {
      onChange('');
    } else if (preset === 'today') {
      onChange(formatDateString(today));
    } else if (preset === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      onChange(formatDateString(tomorrow));
    } else if (preset === 'nextWeek') {
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      onChange(formatDateString(nextWeek));
    }
    setIsOpen(false);
    onClose?.();
  };

  const selectedDateStr = value ? formatDateString(parseDate(value)) : '';
  const todayStr = formatDateString(new Date());

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {trigger ? (
        <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-xs font-medium bg-[#18181b] border border-[#27272a] hover:border-orange-500/50 text-zinc-200 transition-colors"
        >
          <CalendarIcon className="w-3.5 h-3.5 text-orange-500" />
          <span>{value || 'Set Due Date'}</span>
        </button>
      )}

      {isOpen && (
        <div className="absolute top-full mt-1.5 left-0 z-50 w-72 bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl p-3 text-zinc-100">
          {/* Header Month / Year & Prev / Next */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="font-semibold text-xs text-zinc-100">
              {monthNames[month]} {year}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-[6px] text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-[6px] text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-4 gap-1 mb-2.5 pb-2 border-b border-[#27272a]">
            <button
              type="button"
              onClick={() => handleQuickPreset('today')}
              className="px-1.5 py-1 text-[10px] font-medium rounded-[6px] bg-[#18181b] hover:bg-orange-600/20 hover:text-orange-400 text-zinc-300 transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('tomorrow')}
              className="px-1.5 py-1 text-[10px] font-medium rounded-[6px] bg-[#18181b] hover:bg-orange-600/20 hover:text-orange-400 text-zinc-300 transition-colors"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('nextWeek')}
              className="px-1.5 py-1 text-[10px] font-medium rounded-[6px] bg-[#18181b] hover:bg-orange-600/20 hover:text-orange-400 text-zinc-300 transition-colors"
            >
              +1 Week
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('clear')}
              className="px-1.5 py-1 text-[10px] font-medium rounded-[6px] bg-[#18181b] hover:bg-red-950/40 text-red-400 transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <span key={d} className="text-[10px] font-mono text-zinc-500 uppercase">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="w-8 h-8" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateObj = new Date(year, month, dayNum);
              const dateFormatted = formatDateString(dateObj);
              const isSelected = selectedDateStr === dateFormatted;
              const isToday = todayStr === dateFormatted;

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`w-8 h-8 rounded-[6px] text-xs font-mono flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-orange-600 text-white font-bold shadow-sm'
                      : isToday
                      ? 'border border-orange-500/70 text-orange-400 bg-orange-950/20'
                      : 'text-zinc-300 hover:bg-[#18181b] hover:text-zinc-100'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
