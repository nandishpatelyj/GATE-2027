import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Trash2,
} from 'lucide-react';
import { SUBJECTS, useAppState } from '../context/AppStateContext';
import { SUBJECT_MAP } from '../data/syllabus';
import { SubjectId } from '../types';
import {
  addDays,
  formatCompactDate,
  formatShortDate,
  formatWeekdayShort,
  getLocalDateString,
  getWeekDatesMondayFirst,
} from '../utils/dateUtils';
import { getActivePhaseForDate } from '../utils/plannerUtils';

export const StudyPlannerPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    studyPhases,
    topics,
    weeklyBlocks,
    addWeeklyBlock,
    toggleWeeklyBlock,
    deleteWeeklyBlock,
  } = useAppState();

  const todayStr = getLocalDateString();
  const [weekAnchorDate, setWeekAnchorDate] = useState(todayStr);
  const [addingForDate, setAddingForDate] = useState<string | null>(null);
  const [blockTitle, setBlockTitle] = useState('');
  const [blockSubject, setBlockSubject] = useState<SubjectId>('prob_stats');
  const [blockHours, setBlockHours] = useState('1.5');

  const weekDates = useMemo(
    () => getWeekDatesMondayFirst(weekAnchorDate),
    [weekAnchorDate]
  );

  // Deterministic suggested daily topic per calendar day from that day's active phase
  const autoSuggestionByDate = useMemo(() => {
    const map = new Map<string, { phaseTitle: string; topicTitle: string; subjectShort: string }>();
    weekDates.forEach((dStr, idx) => {
      const phase = getActivePhaseForDate(dStr, studyPhases);
      const candidates = topics.filter(
        (t) =>
          phase.subjects.includes(t.subjectId) &&
          t.status !== 'revised'
      );
      const fallback = topics.filter((t) => phase.subjects.includes(t.subjectId));
      const pool = candidates.length > 0 ? candidates : fallback;
      const picked = pool.length > 0 ? pool[(idx + dStr.charCodeAt(9)) % pool.length] : null;

      map.set(dStr, {
        phaseTitle: `P${phase.phase}`,
        topicTitle:
          phase.phase === 5
            ? idx % 2 === 0
              ? 'Full-Length Timed Mock & Analysis'
              : `Spaced Revision: ${picked?.title ?? 'Weak PYQs'}`
            : picked?.title ?? phase.title,
        subjectShort: picked
          ? SUBJECT_MAP[picked.subjectId].shortName
          : 'All Sections',
      });
    });
    return map;
  }, [weekDates, studyPhases, topics]);

  const handleCreateBlock = (e: React.FormEvent, targetDate: string) => {
    e.preventDefault();
    if (!blockTitle.trim()) return;
    const hrs = Math.max(0.25, parseFloat(blockHours || '1') || 1);
    addWeeklyBlock({
      date: targetDate,
      title: blockTitle.trim(),
      subjectId: blockSubject,
      hours: hrs,
      completed: false,
    });
    setBlockTitle('');
    setAddingForDate(null);
  };

  return (
    <div className="space-y-6">
      {/* Backward Roadmap Controls & Header */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Backward Study Planner
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              Automatically computes a 5-phase preparation roadmap working backward from your GATE 2027 DA exam date. Changing the exam date or daily hours recalibrates every phase immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                Plan Start Date
              </label>
              <input
                type="date"
                value={settings.planStartDate}
                max={addDays(settings.examDate, -10)}
                onChange={(e) =>
                  e.target.value &&
                  updateSettings({ planStartDate: e.target.value })
                }
                className="w-full px-3 py-1.5 text-xs font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                GATE DA Exam Date
              </label>
              <input
                type="date"
                value={settings.examDate}
                onChange={(e) =>
                  e.target.value && updateSettings({ examDate: e.target.value })
                }
                className="w-full px-3 py-1.5 text-xs font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                Daily Goal (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min={1}
                max={14}
                value={settings.dailyGoalHours}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!Number.isNaN(v)) {
                    updateSettings({
                      dailyGoalHours: Math.min(14, Math.max(0.5, v)),
                    });
                  }
                }}
                className="w-full px-3 py-1.5 text-xs font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>
          </div>
        </div>

        {/* 5 Backward Phases List */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
          {studyPhases.map((phase) => {
            const isCurrent =
              todayStr >= phase.startDate && todayStr <= phase.endDate;
            return (
              <div
                key={phase.phase}
                className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {phase.title}
                    </h2>
                    {isCurrent && (
                      <span className="text-xs font-medium text-teal-600 dark:text-teal-400">
                        · Active Phase
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {phase.subtitle}
                  </p>
                  <p className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    {formatShortDate(phase.startDate)} →{' '}
                    {formatShortDate(phase.endDate)} · {phase.totalDays} days ·{' '}
                    {phase.plannedHours}h allocated
                  </p>
                </div>

                <div className="flex items-center gap-3 md:w-52 shrink-0">
                  <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-teal-500 transition-all duration-200"
                      style={{ width: `${phase.completionPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300 w-10 text-right">
                    {phase.completionPct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Editable Weekly Calendar View */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Editable Weekly Schedule
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
              {formatShortDate(weekDates[0])} — {formatShortDate(weekDates[6])}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setWeekAnchorDate((d) => addDays(d, -7))}
              aria-label="Previous week"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setWeekAnchorDate(todayStr)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => setWeekAnchorDate((d) => addDays(d, 7))}
              aria-label="Next week"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
          {weekDates.map((dStr) => {
            const isToday = dStr === todayStr;
            const auto = autoSuggestionByDate.get(dStr);
            const dayBlocks = weeklyBlocks.filter((b) => b.date === dStr);
            const isAdding = addingForDate === dStr;

            return (
              <div
                key={dStr}
                className={`p-3 flex flex-col justify-between min-h-[210px] ${
                  isToday ? 'bg-teal-500/[0.04]' : ''
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-baseline justify-between gap-1 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                    <span
                      className={`text-xs font-semibold ${
                        isToday
                          ? 'text-teal-600 dark:text-teal-400'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {formatWeekdayShort(dStr)}
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {formatCompactDate(dStr)}
                    </span>
                  </div>

                  {/* Auto-suggested focus from Phase */}
                  {auto && (
                    <div className="text-xs space-y-0.5 pb-2 border-b border-dashed border-slate-200 dark:border-slate-800">
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {auto.phaseTitle} · {auto.subjectShort}
                      </p>
                      <p className="text-slate-700 dark:text-slate-300 leading-snug line-clamp-2">
                        {auto.topicTitle}
                      </p>
                    </div>
                  )}

                  {/* User custom editable blocks */}
                  <div className="space-y-2">
                    {dayBlocks.map((blk) => (
                      <div
                        key={blk.id}
                        className="group flex items-start justify-between gap-1.5 text-xs"
                      >
                        <button
                          type="button"
                          onClick={() => toggleWeeklyBlock(blk.id)}
                          className="flex items-start gap-1.5 text-left min-w-0 flex-1"
                        >
                          <span
                            className={`mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                              blk.completed
                                ? 'bg-teal-600 border-teal-600 text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {blk.completed && <Check className="w-2.5 h-2.5" />}
                          </span>
                          <span
                            className={`leading-snug ${
                              blk.completed
                                ? 'line-through text-slate-400'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {blk.title}{' '}
                            <span className="font-mono tabular-nums text-slate-400">
                              ({blk.hours}h)
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteWeeklyBlock(blk.id)}
                          aria-label="Remove planned block"
                          className="text-slate-400 hover:text-rose-500 opacity-70 md:opacity-0 md:group-hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 mt-2">
                  {isAdding ? (
                    <form
                      onSubmit={(e) => handleCreateBlock(e, dStr)}
                      className="space-y-1.5"
                    >
                      <input
                        type="text"
                        required
                        autoFocus
                        value={blockTitle}
                        onChange={(e) => setBlockTitle(e.target.value)}
                        placeholder="Study block..."
                        className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      />
                      <div className="flex gap-1">
                        <select
                          value={blockSubject}
                          onChange={(e) =>
                            setBlockSubject(e.target.value as SubjectId)
                          }
                          className="flex-1 min-w-0 px-1.5 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                        >
                          {SUBJECTS.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.shortName}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.5"
                          min={0.5}
                          max={12}
                          value={blockHours}
                          onChange={(e) => setBlockHours(e.target.value)}
                          className="w-12 px-1.5 py-1 text-[11px] font-mono rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                        />
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="submit"
                          className="flex-1 py-1 text-[11px] font-medium rounded bg-teal-600 text-white"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingForDate(null)}
                          className="px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-700 text-slate-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAddingForDate(dStr);
                        setBlockTitle('');
                      }}
                      className="w-full py-1 text-xs text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 flex items-center justify-center gap-1 rounded border border-dashed border-slate-200 dark:border-slate-800 hover:border-teal-500/50 transition-colors whitespace-nowrap"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Block</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
