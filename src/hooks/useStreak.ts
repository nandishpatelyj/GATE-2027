import { useMemo, useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  BadgeDefinition,
  DailyLogEntry,
  DailyTaskItem,
  StreakFreezeState,
  WeeklyPlanCustomBlock,
} from '../types';
import { MAX_MONTHLY_FREEZES, STREAK_BADGES } from '../data/badges';
import {
  addDays,
  diffDays,
  getLocalDateString,
  getMonthKey,
} from '../utils/dateUtils';

export interface DayActivitySummary {
  date: string;
  minutesStudied: number;
  tasksCompleted: number;
  qualifiesNaturally: boolean;
  isFrozen: boolean;
  isActive: boolean;
}

interface UseStreakParams {
  dailyLogs: Record<string, DailyLogEntry>;
  dailyTasks: DailyTaskItem[];
  weeklyBlocks: WeeklyPlanCustomBlock[];
  streakState: StreakFreezeState;
  setStreakState: (
    val:
      | StreakFreezeState
      | ((prev: StreakFreezeState) => StreakFreezeState)
  ) => void;
}

export function fireCelebrationConfetti() {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.65 },
      colors: ['#14b8a6', '#0ea5e9', '#10b981', '#f59e0b'],
    });
  } catch {
    // ignore canvas errors in headless environments
  }
}

export function useStreak({
  dailyLogs,
  dailyTasks,
  weeklyBlocks,
  streakState,
  setStreakState,
}: UseStreakParams) {
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] =
    useState<BadgeDefinition | null>(null);

  const todayStr = getLocalDateString();
  const yesterdayStr = addDays(todayStr, -1);
  const currentMonthKey = getMonthKey(todayStr);

  const activityByDate = useMemo(() => {
    const map = new Map<string, DayActivitySummary>();

    const ensure = (date: string): DayActivitySummary => {
      const existing = map.get(date);
      if (existing) return existing;
      const fresh: DayActivitySummary = {
        date,
        minutesStudied: 0,
        tasksCompleted: 0,
        qualifiesNaturally: false,
        isFrozen: false,
        isActive: false,
      };
      map.set(date, fresh);
      return fresh;
    };

    Object.values(dailyLogs).forEach((entry) => {
      const item = ensure(entry.date);
      const totalHours = Object.values(entry.subjectHours).reduce(
        (sum, h) => sum + (Number(h) || 0),
        0
      );
      item.minutesStudied += Math.round(totalHours * 60);
    });

    dailyTasks.forEach((t) => {
      if (t.completed) {
        const item = ensure(t.date);
        item.tasksCompleted += 1;
      }
    });

    weeklyBlocks.forEach((b) => {
      if (b.completed) {
        const item = ensure(b.date);
        item.tasksCompleted += 1;
      }
    });

    streakState.frozenDates.forEach((fDate) => {
      const item = ensure(fDate);
      item.isFrozen = true;
    });

    map.forEach((item) => {
      item.qualifiesNaturally =
        item.minutesStudied >= 30 || item.tasksCompleted >= 1;
      item.isActive = item.qualifiesNaturally || item.isFrozen;
    });

    return map;
  }, [dailyLogs, dailyTasks, weeklyBlocks, streakState.frozenDates]);

  const { currentStreak, longestStreak, isTodayActive } = useMemo(() => {
    const todayRec = activityByDate.get(todayStr);
    const todayActive = Boolean(todayRec?.isActive);
    const yesterdayActive = Boolean(activityByDate.get(yesterdayStr)?.isActive);

    // Calculate current streak backward from today (or yesterday if today isn't logged yet)
    let cur = 0;
    if (todayActive || yesterdayActive) {
      let cursor = todayActive ? todayStr : yesterdayStr;
      while (activityByDate.get(cursor)?.isActive) {
        cur += 1;
        cursor = addDays(cursor, -1);
      }
    }

    // Calculate longest streak across all active dates
    const activeDates = Array.from(activityByDate.values())
      .filter((d) => d.isActive)
      .map((d) => d.date)
      .sort();

    let maxRun = 0;
    let run = 0;
    for (let i = 0; i < activeDates.length; i++) {
      if (i === 0) {
        run = 1;
      } else {
        const gap = diffDays(activeDates[i - 1], activeDates[i]);
        run = gap === 1 ? run + 1 : 1;
      }
      if (run > maxRun) maxRun = run;
    }

    return {
      currentStreak: cur,
      longestStreak: Math.max(maxRun, cur),
      isTodayActive: todayActive,
    };
  }, [activityByDate, todayStr, yesterdayStr]);

  const freezesUsedThisMonth = useMemo(() => {
    return streakState.frozenDates.filter(
      (d) => getMonthKey(d) === currentMonthKey
    ).length;
  }, [streakState.frozenDates, currentMonthKey]);

  const freezesRemainingThisMonth = Math.max(
    0,
    MAX_MONTHLY_FREEZES - freezesUsedThisMonth
  );

  // Check if yesterday was missed while having a prior streak & allow 1-click rescue, or freeze today
  const canFreezeYesterday = useMemo(() => {
    const yRec = activityByDate.get(yesterdayStr);
    const dayBeforeRec = activityByDate.get(addDays(yesterdayStr, -1));
    return (
      !yRec?.isActive &&
      Boolean(dayBeforeRec?.isActive) &&
      getMonthKey(yesterdayStr) === currentMonthKey &&
      freezesRemainingThisMonth > 0
    );
  }, [activityByDate, yesterdayStr, currentMonthKey, freezesRemainingThisMonth]);

  const applyStreakFreeze = useCallback(
    (targetDateStr: string = todayStr): { ok: boolean; message: string } => {
      const targetMonth = getMonthKey(targetDateStr);
      const usedInTargetMonth = streakState.frozenDates.filter(
        (d) => getMonthKey(d) === targetMonth
      ).length;

      if (streakState.frozenDates.includes(targetDateStr)) {
        return { ok: false, message: 'Streak freeze already active for this date.' };
      }
      if (usedInTargetMonth >= MAX_MONTHLY_FREEZES) {
        return {
          ok: false,
          message: `All ${MAX_MONTHLY_FREEZES} streak freezes for ${targetMonth} have been used.`,
        };
      }

      setStreakState((prev) => ({
        ...prev,
        frozenDates: [...prev.frozenDates, targetDateStr],
      }));
      return {
        ok: true,
        message: `Streak freeze applied for ${targetDateStr}.`,
      };
    },
    [streakState.frozenDates, setStreakState, todayStr]
  );

  // Detect milestone badge unlocks at 7, 21, 50, 75 days
  useEffect(() => {
    const peak = Math.max(currentStreak, longestStreak);
    const newlyEarned = STREAK_BADGES.filter(
      (b) =>
        peak >= b.days && !streakState.unlockedBadgeDays.includes(b.days)
    );

    if (newlyEarned.length > 0) {
      const highestNew = newlyEarned[newlyEarned.length - 1];
      setStreakState((prev) => ({
        ...prev,
        unlockedBadgeDays: Array.from(
          new Set([
            ...prev.unlockedBadgeDays,
            ...newlyEarned.map((b) => b.days),
          ])
        ).sort((a, b) => a - b),
      }));
      setNewlyUnlockedBadge(highestNew);
      fireCelebrationConfetti();
    }
  }, [currentStreak, longestStreak, streakState.unlockedBadgeDays, setStreakState]);

  const dismissUnlockedBadge = useCallback(() => {
    setNewlyUnlockedBadge(null);
  }, []);

  return {
    activityByDate,
    currentStreak,
    longestStreak,
    isTodayActive,
    freezesUsedThisMonth,
    freezesRemainingThisMonth,
    canFreezeYesterday,
    applyStreakFreeze,
    unlockedBadgeDays: streakState.unlockedBadgeDays,
    newlyUnlockedBadge,
    dismissUnlockedBadge,
    celebrateBadge: fireCelebrationConfetti,
  };
}
