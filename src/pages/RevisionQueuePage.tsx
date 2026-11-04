import React from 'react';
import { Check, Clock, BookOpen, RotateCcw } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { SUBJECT_MAP } from '../data/syllabus';
import { SPACED_REVISION_INTERVALS } from '../data/badges';
import { formatShortDate } from '../utils/dateUtils';

export const RevisionQueuePage: React.FC = () => {
  const { revisionQueue, errorLogs, setActivePage } = useAppState();
  const { dueTodayItems, upcomingItems, completeRevision, postponeRevision } =
    revisionQueue;

  return (
    <div className="space-y-6">
      {/* Header & Spaced Schedule Explanation */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Spaced Revision Queue
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Syllabus topics marked{' '}
              <strong className="font-medium text-slate-900 dark:text-slate-200">
                Practised
              </strong>{' '}
              and Mistake Notebook entries resurface automatically at{' '}
              <span className="font-mono tabular-nums text-teal-600 dark:text-teal-400">
                {SPACED_REVISION_INTERVALS.join('d → ')}d
              </span>{' '}
              intervals.
            </p>
          </div>

          <div className="flex items-center gap-5 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400 shrink-0">
            <span>
              Due today:{' '}
              <strong className="text-teal-600 dark:text-teal-400">
                {dueTodayItems.length}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Scheduled ahead:{' '}
              <strong className="text-slate-900 dark:text-white">
                {upcomingItems.length}
              </strong>
            </span>
          </div>
        </div>
      </section>

      {/* Today's Revision List */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Today&apos;s Revision ({dueTodayItems.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Completing a review advances the item to its next spaced interval and counts toward your daily streak
            </p>
          </div>
        </div>

        {dueTodayItems.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              All caught up for today
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Mark topics as Practised in the Syllabus Tracker or record mistakes in the Error Log to populate future spaced reviews.
            </p>
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setActivePage('syllabus')}
                className="px-3.5 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors inline-flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Open Syllabus</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePage('errors')}
                className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Open Error Log
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {dueTodayItems.map((item) => {
              const matchedErr =
                item.type === 'error'
                  ? errorLogs.find((e) => e.id === item.sourceId)
                  : undefined;

              return (
                <div
                  key={item.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <span>{SUBJECT_MAP[item.subjectId].name}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{item.subtitle}</span>
                      <span aria-hidden="true"> · </span>
                      <span
                        className={
                          item.isOverdue
                            ? 'text-amber-600 dark:text-amber-400 font-medium'
                            : 'font-mono tabular-nums'
                        }
                      >
                        {item.isOverdue
                          ? `Overdue since ${formatShortDate(item.dueDate)}`
                          : 'Due today'}
                      </span>
                    </p>
                    {matchedErr && (
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 pt-1">
                        Fix check: {matchedErr.correctApproach}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => completeRevision(item)}
                      className="px-3.5 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Done</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => postponeRevision(item, 1)}
                      className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Postpone +1d</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Upcoming Revisions */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Upcoming Spaced Queue ({upcomingItems.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Scheduled future reviews across the 1, 3, 7, 21, and 45-day retention curve
          </p>
        </div>

        {upcomingItems.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No upcoming revisions scheduled yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {upcomingItems.map((item) => (
              <div
                key={item.id}
                className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span>{SUBJECT_MAP[item.subjectId].shortName}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{item.subtitle}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      Scheduled {formatShortDate(item.dueDate)}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => completeRevision(item)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start sm:self-center"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Review Early</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
