// TimePicker12h — 12-hour AM/PM time picker
// Stores value as 24-hour string (e.g. "15:30") internally, displays as 12-hour (e.g. "3:30 PM")
// Replaces native <input type="time"> which renders 24-hour in most browsers
import { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ['00', '15', '30', '45'];
const AM_PM = ['AM', 'PM'];

function to12h(val24) {
  if (!val24) return { hour: '', minute: '', ampm: 'AM' };
  const [h, m] = val24.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return { hour: '', minute: '', ampm: 'AM' };
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return { hour: String(hour), minute: String(m).padStart(2, '0'), ampm };
}

function to24h(hour, minute, ampm) {
  if (!hour || !minute) return '';
  let h = parseInt(hour);
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return String(h).padStart(2, '0') + ':' + String(minute).padStart(2, '0');
}

export default function TimePicker12h({ value, onChange, label, disabled, className }) {
  const initial = to12h(value);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [ampm, setAmpm] = useState(initial.ampm);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const v = to12h(value);
    setHour(v.hour);
    setMinute(v.minute);
    setAmpm(v.ampm);
  }, [value]);

  const handleChange = (h, m, a) => {
    setHour(h); setMinute(m); setAmpm(a);
    const v24 = to24h(h, m, a);
    if (onChange && v24) onChange(v24);
  };

  const display = value ? to12h(value) : null;
  const displayText = display && display.hour
    ? `${display.hour}:${display.minute} ${display.ampm}`
    : '';

  return (
    <div className={cn('space-y-1', className)}>
      {label && <label className="block text-[10px] font-semibold text-ink-muted uppercase tracking-[0.04em] mb-1">{label}</label>}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(o => !o)}
          className={cn(
            'flex items-center gap-2 w-full h-[38px] px-3 rounded-lg bg-white border transition-all duration-150 text-left',
            'border-line hover:border-brand/40 focus:border-brand focus:shadow-focus',
            disabled && 'opacity-50 cursor-not-allowed bg-canvas-soft'
          )}
        >
          <span className={cn('flex-1 text-[13px]', displayText ? 'text-ink' : 'text-ink-faint')}>
            {displayText || '--:-- --'}
          </span>
          <ChevronDown className={cn('w-4 h-4 text-ink-faint flex-shrink-0 transition-transform', open && 'rotate-180')} />
        </button>
        {open && !disabled && (
          <div className="absolute top-full left-0 mt-1 z-[100] bg-white rounded-xl border border-line shadow-dropdown overflow-hidden">
            <div className="flex p-2 gap-2">
              {/* Hour */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-ink-faint mb-1">Hr</span>
                <div className="max-h-[140px] overflow-y-auto overscroll-contain">
                  {HOURS.map((h) => (
                    <button key={h} type="button" onClick={() => handleChange(String(h), minute, ampm)}
                      className={cn('w-10 h-8 flex items-center justify-center text-[13px] rounded-md hover:bg-canvas-soft transition-colors',
                        String(h) === hour && 'bg-brand-50 text-brand-600 font-semibold')}>
                      {h}
                    </button>
                  ))}
                </div>
              </div>
              {/* Minute */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-ink-faint mb-1">Min</span>
                <div className="max-h-[140px] overflow-y-auto overscroll-contain">
                  {MINUTES.map((m) => (
                    <button key={m} type="button" onClick={() => handleChange(hour, m, ampm)}
                      className={cn('w-10 h-8 flex items-center justify-center text-[13px] rounded-md hover:bg-canvas-soft transition-colors',
                        m === minute && 'bg-brand-50 text-brand-600 font-semibold')}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              {/* AM/PM */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-ink-faint mb-1">&nbsp;</span>
                <div className="flex flex-col gap-1">
                  {AM_PM.map((a) => (
                    <button key={a} type="button" onClick={() => handleChange(hour, minute, a)}
                      className={cn('w-10 h-8 flex items-center justify-center text-[12px] font-semibold rounded-md hover:bg-canvas-soft transition-colors',
                        a === ampm && 'bg-brand-50 text-brand-600')}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end px-2 pb-2">
              <button type="button" onClick={() => setOpen(false)}
                className="px-3 py-1 text-[11px] font-semibold text-brand-600 hover:bg-brand-50 rounded-md transition-colors">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}