import { useState, useEffect, useRef } from 'react';

interface CustomTimePickerProps {
  value: string; // "HH:MM" format
  onChange: (time: string) => void;
}

export function CustomTimePicker({ value, onChange }: CustomTimePickerProps) {
  const parseTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return { hour: isNaN(h) ? 7 : h, minute: isNaN(m) ? 0 : m };
  };

  const { hour: initHour, minute: initMinute } = parseTime(value);
  const [hour, setHour] = useState(initHour);
  const [minute, setMinute] = useState(initMinute);
  const [isManual, setIsManual] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [manualError, setManualError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const { hour: h, minute: m } = parseTime(value);
    setHour(h);
    setMinute(m);
  }, [value]);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const amPm = hour < 12 ? 'AM' : 'PM';
  const display12 = hour % 12 === 0 ? 12 : hour % 12;

  const toggleAmPm = () => {
    const newH = hour < 12 ? hour + 12 : hour - 12;
    setHour(newH);
    onChange(`${pad(newH)}:${pad(minute)}`);
  };

  // Double tap to open manual input
  const handleDisplayTap = () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 400);
    if (tapCount.current >= 2) {
      tapCount.current = 0;
      setManualInput(`${pad(display12)}:${pad(minute)}`);
      setManualError('');
      setIsManual(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Manual input confirm
  const confirmManual = () => {
    const trimmed = manualInput.trim();
    const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) { setManualError('Format: HH:MM (e.g. 07:30)'); return; }
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    if (h < 1 || h > 12) { setManualError('Hour: 1–12'); return; }
    if (m < 0 || m > 59) { setManualError('Minute: 0–59'); return; }
    // Convert 12h to 24h based on current AM/PM
    if (amPm === 'PM' && h !== 12) h += 12;
    if (amPm === 'AM' && h === 12) h = 0;
    setHour(h);
    setMinute(m);
    onChange(`${pad(h)}:${pad(m)}`);
    setIsManual(false);
    setManualError('');
  };

  if (isManual) {
    return (
      <div className="bg-indigo-50 dark:bg-slate-700 rounded-xl p-4">
        <p className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold mb-2 flex items-center gap-1">
          <i className="fas fa-keyboard"></i> Enter time manually
        </p>
        <div className="flex gap-2 items-center mb-1">
          <input
            ref={inputRef}
            type="text"
            value={manualInput}
            onChange={e => { setManualInput(e.target.value); setManualError(''); }}
            placeholder="07:30"
            maxLength={5}
            className="flex-1 p-2.5 text-xl font-bold text-center border-2 border-indigo-400 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-white focus:outline-none focus:border-indigo-600 tracking-widest"
          />
          {/* AM/PM toggle */}
          <button type="button" onClick={toggleAmPm}
            className="px-3 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm min-w-[52px]">
            {amPm}
          </button>
        </div>
        {manualError && <p className="text-xs text-red-500 mb-2">{manualError}</p>}
        <div className="flex gap-2 mt-2">
          <button type="button" onClick={() => { setIsManual(false); setManualError(''); }}
            className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300 font-semibold text-sm">
            Cancel
          </button>
          <button type="button" onClick={confirmManual}
            className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-sm">
            Set Time
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">Format: HH:MM (e.g. 07:30)</p>
      </div>
    );
  }

  return (
    <div className="bg-indigo-50 dark:bg-slate-700 rounded-xl p-3 select-none">
      {/* Time Display — double tap to edit manually */}
      <div className="flex items-center justify-center gap-3 mb-1">

        {/* Clock display — tap twice to edit */}
        <button
          type="button"
          onClick={handleDisplayTap}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 border-2 border-indigo-300 dark:border-indigo-500 rounded-xl px-4 py-2.5 active:scale-95 transition-transform"
          title="Double tap to edit manually"
        >
          <i className="fas fa-clock text-indigo-400 text-sm"></i>
          <span className="text-2xl font-bold text-gray-800 dark:text-white tracking-wider">
            {pad(display12)}:{pad(minute)}
          </span>
        </button>

        {/* AM/PM Toggle */}
        <button type="button" onClick={toggleAmPm}
          className="flex flex-col rounded-xl overflow-hidden border-2 border-indigo-300 dark:border-indigo-500">
          <span className={`px-3 py-1.5 text-sm font-bold transition-all ${amPm === 'AM' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-400 dark:text-gray-500'}`}>
            AM
          </span>
          <span className={`px-3 py-1.5 text-sm font-bold transition-all ${amPm === 'PM' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-400 dark:text-gray-500'}`}>
            PM
          </span>
        </button>
      </div>

      {/* Hint */}
      <p className="text-center text-xs text-indigo-400 dark:text-indigo-400 mt-1 flex items-center justify-center gap-1">
        <i className="fas fa-hand-pointer text-xs"></i>
        Double tap time to type manually
      </p>
    </div>
  );
}
