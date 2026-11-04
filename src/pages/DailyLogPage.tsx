import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import {
  createEmptySubjectHours,
  SUBJECTS,
  useAppState,
} from '../context/AppStateContext';
import { DailyLogEntry, SubjectId } from '../types';
import {
  formatShortDate,
  getLocalDateString,
  getMonthGridMondayFirst,
  parseLocalDate,
} from '../utils/dateUtils';

const MOOD_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '1 · Drained',
  2: '2 · Low',
  3: '3 · Steady',
  4: '4 · Focused',
  5: '5 · Peak',
};

export const DailyLogPage: React.FC = () => {
  const { dailyLogs, upsertDailyLog } = useAppState();

  const todayStr = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const initialDt = parseLocalDate(todayStr);
  const [viewYear, setViewYear] = useState(initialDt.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDt.getMonth());

  // Form state synced with selectedDate
  const [subjectHours, setSubjectHours] = useState<Record<SubjectId, number>>(
    () => createEmptySubjectHours()
  );
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [whatILearned, setWhatILearned] = useState('');
  const [whatConfusedMe, setWhatConfusedMe] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    const existing = dailyLogs[selectedDate];
    if (existing) {
      setSubjectHours({
        ...createEmptySubjectHours(),
        ...existing.subjectHours,
      });
      setMood(existing.mood);
      setWhatILearned(existing.whatILearned);
      setWhatConfusedMe(existing.whatConfusedMe);
    } else {
      setSubjectHours(createEmptySubjectHours());
      setMood(4);
      setWhatILearned('');
      setWhatConfusedMe('');
    }
  }, [selectedDate, dailyLogs]);

  const totalDayHours = useMemo(() => {
    const sum = Object.values(subjectHours).reduce(
      (acc, v) => acc + (Number(v) || 0),
      0
    );
    return Math.round(sum * 100) / 100;
  }, [subjectHours]);

  const handleHourInput = (subjId: SubjectId, raw: string) => {
    const parsed = parseFloat(raw);
    const clean = Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(18, parsed));
    setSubjectHours((prev) => ({
      ...prev,
      [subjId]: clean,
    }));
  };

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: DailyLogEntry = {
      date: selectedDate,
      subjectHours,
      mood,
      whatILearned: whatILearned.trim(),
      whatConfusedMe: whatConfusedMe.trim(),
    };
    upsertDailyLog(entry);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2500);
  };

  const calendarCells = useMemo(
    () => getMonthGridMondayFirst(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const monthTitle = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    'en-US',
    { month: 'long', year: 'numeric' }
  );

  const shiftMonth = (delta: number) => {
    const dt = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(dt.getFullYear());
    setViewMonth(dt.getMonth());
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Daily Journal & Subject Hours Form (7 cols) */}
        <section className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Daily Study Log
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Editing entry for{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {formatShortDate(selectedDate)}
                </strong>{' '}
                {selectedDate === todayStr ? '(Today)' : ''}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Total Logged
              </span>
              <p className="text-xl font-bold font-mono tabular-nums text-teal-600 dark:text-teal-400">
                {totalDayHours.toFixed(2)}h
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveLog} className="space-y-5">
            {/* Hours per Subject */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                Hours Studied per Subject (completed Pomodoro sessions add here automatically)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SUBJECTS.map((subj) => (
                  <div key={subj.id}>
                    <label
                      htmlFor={`hr_${subj.id}`}
                      className="block text-xs text-slate-500 dark:text-slate-400 truncate mb-1"
                    >
                      {subj.shortName}
                    </label>
                    <input
                      id={`hr_${subj.id}`}
                      type="number"
                      step="0.25"
                      min={0}
                      max={18}
                      value={subjectHours[subj.id] || ''}
                      onChange={(e) => handleHourInput(subj.id, e.target.value)}
                      placeholder="0.0"
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Mood 1-5 */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                Focus &amp; Energy Mood (1–5)
              </label>
              <div className="grid grid-cols-5 gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/90">
                {([1, 2, 3, 4, 5] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setMood(level)}
                    className={`py-2 px-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap truncate ${
                      mood === level
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {MOOD_LABELS[level]}
                  </button>
                ))}
              </div>
            </div>

            {/* Reflections */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  What I Learned Today
                </label>
                <textarea
                  rows={3}
                  value={whatILearned}
                  onChange={(e) => setWhatILearned(e.target.value)}
                  placeholder="Key theorems, insights, shortcuts, or PYQ patterns mastered..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  What Confused Me / Follow-Up Questions
                </label>
                <textarea
                  rows={3}
                  value={whatConfusedMe}
                  onChange={(e) => setWhatConfusedMe(e.target.value)}
                  placeholder="Concepts that felt shaky or require re-reading tomorrow..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {savedNotice && (
                  <span className="inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Daily log saved for {formatShortDate(selectedDate)}
                  </span>
                )}
              </div>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors whitespace-nowrap"
              >
                Save Daily Log
              </button>
            </div>
          </form>
        </section>

        {/* Right: Monthly Calendar View of Past Logs (5 cols) */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {monthTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select any day to view or edit its study log
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="Previous month"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const nowDt = parseLocalDate(todayStr);
                  setViewYear(nowDt.getFullYear());
                  setViewMonth(nowDt.getMonth());
                  setSelectedDate(todayStr);
                }}
                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="Next month"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-400 pb-1">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map(({ dateStr, inMonth }) => {
              const dayNum = Number(dateStr.split('-')[2]);
              const entry = dailyLogs[dateStr];
              const dayHrs = entry
                ? Object.values(entry.subjectHours).reduce(
                    (s, h) => s + (Number(h) || 0),
                    0
                  )
                : 0;
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === todayStr;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-14 p-1.5 rounded-lg border text-left flex flex-col justify-between transition-colors ${
                    isSelected
                      ? 'border-teal-500 bg-teal-500/15'
                      : dayHrs > 0
                      ? 'border-teal-500/30 bg-teal-500/[0.06] hover:bg-teal-500/10'
                      : 'border-slate-200/70 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  } ${!inMonth ? 'opacity-40' : ''}`}
                >
                  <span
                    className={`text-xs font-mono tabular-nums ${
                      isToday
                        ? 'font-bold text-teal-600 dark:text-teal-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayHrs > 0 && (
                    <span className="text-[10px] font-mono tabular-nums text-teal-700 dark:text-teal-300 truncate">
                      {dayHrs.toFixed(1)}h · M{entry.mood}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Preview of selected day's notes if recorded */}
          {dailyLogs[selectedDate] &&
            (dailyLogs[selectedDate].whatILearned ||
              dailyLogs[selectedDate].whatConfusedMe) && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Journal Summary · {formatShortDate(selectedDate)}
                </p>
                {dailyLogs[selectedDate].whatILearned && (
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong className="text-teal-600 dark:text-teal-400">
                      Learned:{' '}
                    </strong>
                    {dailyLogs[selectedDate].whatILearned}
                  </p>
                )}
                {dailyLogs[selectedDate].whatConfusedMe && (
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong className="text-amber-600 dark:text-amber-400">
                      Confused:{' '}
                    </strong>
                    {dailyLogs[selectedDate].whatConfusedMe}
                  </p>
                )}
              </div>
            )}
        </section>
      </div>
    </div>
  );
};
