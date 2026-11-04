import React, { useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
} from 'lucide-react';
import {
  BREAK_DURATION_SEC,
  FOCUS_DURATION_SEC,
  SUBJECTS,
  useAppState,
} from '../context/AppStateContext';
import { SUBJECT_MAP } from '../data/syllabus';
import { SubjectId } from '../types';
import { getLocalDateString } from '../utils/dateUtils';

export const PomodoroPage: React.FC = () => {
  const { pomodoro, settings, updateSettings } = useAppState();
  const {
    mode,
    secondsLeft,
    isRunning,
    selectedSubject,
    sessions,
    setSelectedSubject,
    setMode,
    toggleStartPause,
    resetTimer,
    completeEarlyAndCredit,
  } = pomodoro;

  const totalSec = mode === 'focus' ? FOCUS_DURATION_SEC : BREAK_DURATION_SEC;
  const progress = Math.max(0, Math.min(1, 1 - secondsLeft / totalSec));
  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  const todayStr = getLocalDateString();
  const todaysSessions = sessions.filter((s) => s.date === todayStr);
  const todaysFocusMinutes = todaysSessions.reduce(
    (sum, s) => sum + s.durationMin,
    0
  );

  // Keyboard shortcut: Space to toggle start/pause when not typing in select/input
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggleStartPause();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleStartPause]);

  const radius = 108;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Pomodoro Study Timer
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              25m focus / 5m break · Completed focus sessions are automatically added to today&apos;s Daily Log hours
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setMode('focus')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  mode === 'focus'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Focus (25:00)
              </button>
              <button
                type="button"
                onClick={() => setMode('break')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  mode === 'break'
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Break (05:00)
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                updateSettings({ soundEnabled: !settings.soundEnabled })
              }
              aria-label={
                settings.soundEnabled ? 'Mute timer chime' : 'Unmute timer chime'
              }
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Central Timer Ring & Controls */}
        <div className="py-8 flex flex-col items-center justify-center space-y-6">
          <div className="w-full max-w-xs">
            <label
              htmlFor="pomodoro-subject"
              className="block text-xs text-center text-slate-500 dark:text-slate-400 mb-1.5"
            >
              Active Subject
            </label>
            <select
              id="pomodoro-subject"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value as SubjectId)}
              className="w-full px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex items-center justify-center">
            <svg width="256" height="256" viewBox="0 0 256 256">
              <circle
                cx="128"
                cy="128"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-200 dark:text-slate-800"
              />
              <circle
                cx="128"
                cy="128"
                r={radius}
                fill="none"
                stroke={mode === 'focus' ? '#14b8a6' : '#0ea5e9'}
                strokeWidth="8"
                strokeLinecap="round"
                transform="rotate(-90 128 128)"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold font-mono tabular-nums tracking-tight text-slate-900 dark:text-white">
                {mins}:{secs}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                {mode === 'focus'
                  ? SUBJECT_MAP[selectedSubject].shortName
                  : 'Short Recovery Break'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={toggleStartPause}
              className="px-6 py-2.5 text-sm font-medium rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors inline-flex items-center gap-2 whitespace-nowrap"
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>{secondsLeft < totalSec ? 'Resume' : 'Start Session'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={resetTimer}
              className="px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>

            {mode === 'focus' && secondsLeft <= FOCUS_DURATION_SEC - 60 && (
              <button
                type="button"
                onClick={completeEarlyAndCredit}
                className="px-4 py-2.5 text-sm font-medium rounded-lg border border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-500/10 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Log Elapsed &amp; Finish</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Today's Completed Pomodoro Sessions */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Today&apos;s Completed Sessions ({todaysSessions.length})
          </h2>
          <span className="text-xs font-mono tabular-nums text-teal-600 dark:text-teal-400 font-medium">
            {todaysFocusMinutes} min ({(todaysFocusMinutes / 60).toFixed(2)}h) credited today
          </span>
        </div>

        {todaysSessions.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No focus sessions completed yet today. Press Space or click Start Session above to begin.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {todaysSessions.map((sess) => (
              <div
                key={sess.id}
                className="px-5 py-3 flex items-center justify-between text-sm"
              >
                <div>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {SUBJECT_MAP[sess.subjectId].name}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                    · Completed at {sess.completedAt}
                  </span>
                </div>
                <span className="font-mono tabular-nums text-xs text-teal-600 dark:text-teal-400 font-semibold">
                  +{sess.durationMin}m
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
