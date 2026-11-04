import React, { useMemo, useState } from 'react';
import { DayActivitySummary } from '../hooks/useStreak';
import {
  addDays,
  formatShortDate,
  getLocalDateString,
  parseLocalDate,
} from '../utils/dateUtils';

interface HeatmapProps {
  activityByDate: Map<string, DayActivitySummary>;
  weeksCount?: number;
}

export const Heatmap: React.FC<HeatmapProps> = ({
  activityByDate,
  weeksCount = 26,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{
    date: string;
    minutes: number;
    tasks: number;
    isFrozen: boolean;
  } | null>(null);

  const todayStr = getLocalDateString();

  const { columns, monthLabels } = useMemo(() => {
    const todayDt = parseLocalDate(todayStr);
    const dow = todayDt.getDay(); // 0=Sun..6=Sat
    const offsetToSundayEnd = dow === 0 ? 0 : 7 - dow;
    const endSundayStr = addDays(todayStr, offsetToSundayEnd);
    const totalDays = weeksCount * 7;
    const startMondayStr = addDays(endSundayStr, -(totalDays - 1));

    const cols: { dateStr: string; isFuture: boolean }[][] = [];
    const mLabels: { colIndex: number; label: string }[] = [];
    let lastMonth = -1;

    for (let w = 0; w < weeksCount; w++) {
      const col: { dateStr: string; isFuture: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const dStr = addDays(startMondayStr, w * 7 + d);
        col.push({
          dateStr: dStr,
          isFuture: dStr > todayStr,
        });
        if (d === 0) {
          const dt = parseLocalDate(dStr);
          const m = dt.getMonth();
          if (m !== lastMonth) {
            mLabels.push({
              colIndex: w,
              label: dt.toLocaleDateString('en-US', { month: 'short' }),
            });
            lastMonth = m;
          }
        }
      }
      cols.push(col);
    }

    return { columns: cols, monthLabels: mLabels };
  }, [todayStr, weeksCount]);

  const getCellClass = (dateStr: string, isFuture: boolean) => {
    if (isFuture) {
      return 'bg-slate-100/50 dark:bg-slate-900/40 opacity-35';
    }
    const rec = activityByDate.get(dateStr);
    if (!rec) {
      return 'bg-slate-200/80 dark:bg-slate-800/80 hover:ring-1 hover:ring-slate-400';
    }
    if (rec.isFrozen && !rec.qualifiesNaturally) {
      return 'bg-sky-400/70 dark:bg-sky-500/60 hover:ring-1 hover:ring-sky-300';
    }
    const mins = rec.minutesStudied;
    if (mins >= 240) {
      return 'bg-teal-600 dark:bg-teal-400 hover:ring-1 hover:ring-teal-200';
    }
    if (mins >= 120) {
      return 'bg-teal-500 dark:bg-teal-500 hover:ring-1 hover:ring-teal-300';
    }
    if (mins >= 45) {
      return 'bg-teal-400/85 dark:bg-teal-600 hover:ring-1 hover:ring-teal-300';
    }
    if (mins > 0 || rec.tasksCompleted > 0) {
      return 'bg-teal-300/80 dark:bg-teal-800 hover:ring-1 hover:ring-teal-400';
    }
    return 'bg-slate-200/80 dark:bg-slate-800/80 hover:ring-1 hover:ring-slate-400';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 min-h-5">
        <div>
          {hoveredCell ? (
            <span className="font-mono tabular-nums text-slate-700 dark:text-slate-200">
              {formatShortDate(hoveredCell.date)} ·{' '}
              {(hoveredCell.minutes / 60).toFixed(1)}h studied ·{' '}
              {hoveredCell.tasks} task{hoveredCell.tasks === 1 ? '' : 's'}
              {hoveredCell.isFrozen ? ' · Streak Freeze' : ''}
            </span>
          ) : (
            <span>Hover any day to inspect logged hours and tasks</span>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <span>Less</span>
          <span className="w-3 h-3 rounded-[3px] bg-slate-200/80 dark:bg-slate-800/80 inline-block" />
          <span className="w-3 h-3 rounded-[3px] bg-teal-300/80 dark:bg-teal-800 inline-block" />
          <span className="w-3 h-3 rounded-[3px] bg-teal-400/85 dark:bg-teal-600 inline-block" />
          <span className="w-3 h-3 rounded-[3px] bg-teal-500 dark:bg-teal-500 inline-block" />
          <span className="w-3 h-3 rounded-[3px] bg-teal-600 dark:bg-teal-400 inline-block" />
          <span>More</span>
          <span aria-hidden="true" className="mx-1">·</span>
          <span className="w-3 h-3 rounded-[3px] bg-sky-400/70 dark:bg-sky-500/60 inline-block" />
          <span>Freeze</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-block min-w-full">
          {/* Month header row */}
          <div className="flex items-center pl-8 mb-1.5 text-[11px] text-slate-500 dark:text-slate-400 select-none">
            <div className="relative h-4 w-full">
              {monthLabels.map((m, i) => (
                <span
                  key={`${m.label}_${i}`}
                  style={{ left: `${m.colIndex * 16}px` }}
                  className="absolute top-0 whitespace-nowrap"
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2">
            {/* Weekday labels */}
            <div className="grid grid-rows-7 gap-1 text-[10px] leading-3 text-slate-400 dark:text-slate-500 w-6 pt-0.5 select-none">
              <span>Mon</span>
              <span />
              <span>Wed</span>
              <span />
              <span>Fri</span>
              <span />
              <span>Sun</span>
            </div>

            {/* Columns */}
            <div className="flex gap-1">
              {columns.map((col, wIdx) => (
                <div key={wIdx} className="grid grid-rows-7 gap-1">
                  {col.map(({ dateStr, isFuture }) => {
                    const rec = activityByDate.get(dateStr);
                    return (
                      <button
                        key={dateStr}
                        type="button"
                        disabled={isFuture}
                        onMouseEnter={() =>
                          setHoveredCell({
                            date: dateStr,
                            minutes: rec?.minutesStudied ?? 0,
                            tasks: rec?.tasksCompleted ?? 0,
                            isFrozen: Boolean(rec?.isFrozen),
                          })
                        }
                        onFocus={() =>
                          setHoveredCell({
                            date: dateStr,
                            minutes: rec?.minutesStudied ?? 0,
                            tasks: rec?.tasksCompleted ?? 0,
                            isFrozen: Boolean(rec?.isFrozen),
                          })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                        aria-label={`${dateStr}: ${
                          rec ? `${rec.minutesStudied} minutes studied` : 'No activity'
                        }`}
                        className={`w-3 h-3 rounded-[3px] transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${getCellClass(
                          dateStr,
                          isFuture
                        )}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
