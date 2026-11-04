import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  AppPage,
  DailyLogEntry,
  DailyTaskItem,
  ErrorLogEntry,
  ImportanceLevel,
  MockTestEntry,
  PomodoroSessionRecord,
  PyqLogEntry,
  ResourceItem,
  RevisionQueueItem,
  StreakFreezeState,
  StudyPhase,
  SubjectId,
  SyllabusTopic,
  TopicPyqManualAdjustment,
  TopicStatus,
  UserSettings,
  WeeklyPlanCustomBlock,
} from '../types';
import { INITIAL_SYLLABUS_TOPICS, SUBJECTS } from '../data/syllabus';
import { INITIAL_RESOURCES } from '../data/resources';
import { SPACED_REVISION_INTERVALS } from '../data/badges';
import { getStorage, STORAGE_KEYS } from '../utils/storage';
import { addDays, getLocalDateString } from '../utils/dateUtils';
import {
  buildBackwardStudyPhases,
  generateAutoTodaysTasks,
} from '../utils/plannerUtils';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { CountdownState, useCountdown } from '../hooks/useCountdown';
import { DayActivitySummary, useStreak } from '../hooks/useStreak';
import { useRevisionQueue } from '../hooks/useRevisionQueue';
import { createDemoSnapshot } from '../data/demoData';

const DEFAULT_SETTINGS: UserSettings = {
  examDate: '2027-02-06',
  planStartDate: getLocalDateString(),
  dailyGoalHours: 4,
  targetScore: 60,
  theme: 'dark',
  soundEnabled: true,
};

const DEFAULT_STREAK_STATE: StreakFreezeState = {
  frozenDates: [],
  unlockedBadgeDays: [],
};

export function createEmptySubjectHours(): Record<SubjectId, number> {
  return {
    prob_stats: 0,
    linear_algebra: 0,
    calculus_opt: 0,
    prog_dsa: 0,
    dbms_warehouse: 0,
    machine_learning: 0,
    artificial_intelligence: 0,
    general_aptitude: 0,
  };
}

function playCompletionChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99]; // C5 - E5 - G5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(
        0.12,
        ctx.currentTime + idx * 0.14 + 0.04
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + idx * 0.14 + 0.55
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.14);
      osc.stop(ctx.currentTime + idx * 0.14 + 0.6);
    });
  } catch {
    // ignore audio autoplay restrictions
  }
}

export interface TopicPyqComputed {
  topicId: string;
  attempted: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracyPct: number | null;
  isWeak: boolean;
}

export type PomodoroMode = 'focus' | 'break';

interface AppStateContextValue {
  activePage: AppPage;
  setActivePage: (page: AppPage) => void;

  settings: UserSettings;
  updateSettings: (patch: Partial<UserSettings>) => void;
  countdown: CountdownState;

  topics: SyllabusTopic[];
  updateTopicStatus: (topicId: string, status: TopicStatus) => void;
  updateTopicDetails: (
    topicId: string,
    patch: Partial<Pick<SyllabusTopic, 'importance' | 'videoUrl' | 'notesUrl'>>
  ) => void;

  pyqLogs: PyqLogEntry[];
  addPyqLog: (entry: Omit<PyqLogEntry, 'id'>) => void;
  togglePyqRevisit: (id: string) => void;
  deletePyqLog: (id: string) => void;
  manualPyqAdjustments: Record<string, TopicPyqManualAdjustment>;
  adjustTopicPyqCounts: (
    topicId: string,
    delta: { correct?: number; wrong?: number; skipped?: number }
  ) => void;
  topicPyqStatsMap: Map<string, TopicPyqComputed>;

  mockTests: MockTestEntry[];
  addMockTest: (entry: Omit<MockTestEntry, 'id'>) => void;
  deleteMockTest: (id: string) => void;

  errorLogs: ErrorLogEntry[];
  addErrorLog: (
    entry: Omit<
      ErrorLogEntry,
      'id' | 'createdAt' | 'revisionStage' | 'nextRevisionDate'
    >
  ) => void;
  deleteErrorLog: (id: string) => void;

  revisionQueue: {
    allQueueItems: RevisionQueueItem[];
    dueTodayItems: RevisionQueueItem[];
    upcomingItems: RevisionQueueItem[];
    completeRevision: (item: RevisionQueueItem) => void;
    postponeRevision: (item: RevisionQueueItem, days?: number) => void;
  };

  studyPhases: StudyPhase[];
  todaysTasks: DailyTaskItem[];
  toggleDailyTask: (taskId: string) => void;
  addCustomDailyTask: (title: string, subjectId?: SubjectId) => void;
  deleteDailyTask: (taskId: string) => void;

  weeklyBlocks: WeeklyPlanCustomBlock[];
  addWeeklyBlock: (block: Omit<WeeklyPlanCustomBlock, 'id'>) => void;
  toggleWeeklyBlock: (id: string) => void;
  deleteWeeklyBlock: (id: string) => void;

  dailyLogs: Record<string, DailyLogEntry>;
  upsertDailyLog: (entry: DailyLogEntry) => void;
  addStudyHours: (dateStr: string, subjectId: SubjectId, hoursDelta: number) => void;

  streak: {
    activityByDate: Map<string, DayActivitySummary>;
    currentStreak: number;
    longestStreak: number;
    isTodayActive: boolean;
    freezesUsedThisMonth: number;
    freezesRemainingThisMonth: number;
    canFreezeYesterday: boolean;
    applyStreakFreeze: (dateStr?: string) => { ok: boolean; message: string };
    unlockedBadgeDays: number[];
    newlyUnlockedBadge: ReturnType<typeof useStreak>['newlyUnlockedBadge'];
    dismissUnlockedBadge: () => void;
    celebrateBadge: () => void;
  };

  pomodoro: {
    mode: PomodoroMode;
    secondsLeft: number;
    isRunning: boolean;
    selectedSubject: SubjectId;
    sessions: PomodoroSessionRecord[];
    setSelectedSubject: (s: SubjectId) => void;
    setMode: (m: PomodoroMode) => void;
    toggleStartPause: () => void;
    resetTimer: () => void;
    completeEarlyAndCredit: () => void;
  };

  resources: ResourceItem[];
  addResource: (item: Omit<ResourceItem, 'id' | 'addedDate'>) => void;
  deleteResource: (id: string) => void;

  exportAllJson: () => string;
  importAllJson: (rawJson: string) => { ok: boolean; message: string };
  resetAllData: () => void;
  loadDemoData: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export const FOCUS_DURATION_SEC = 25 * 60;
export const BREAK_DURATION_SEC = 5 * 60;

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activePage, setActivePage] = useState<AppPage>('dashboard');

  const [settings, setSettings] = useLocalStorage<UserSettings>(
    STORAGE_KEYS.SETTINGS,
    DEFAULT_SETTINGS
  );
  const [topics, setTopics] = useLocalStorage<SyllabusTopic[]>(
    STORAGE_KEYS.SYLLABUS,
    INITIAL_SYLLABUS_TOPICS
  );
  const [pyqLogs, setPyqLogs] = useLocalStorage<PyqLogEntry[]>(
    STORAGE_KEYS.PYQ_LOGS,
    []
  );
  const [manualPyqAdjustments, setManualPyqAdjustments] = useLocalStorage<
    Record<string, TopicPyqManualAdjustment>
  >(STORAGE_KEYS.PYQ_MANUAL, {});
  const [mockTests, setMockTests] = useLocalStorage<MockTestEntry[]>(
    STORAGE_KEYS.MOCK_TESTS,
    []
  );
  const [errorLogs, setErrorLogs] = useLocalStorage<ErrorLogEntry[]>(
    STORAGE_KEYS.ERROR_LOGS,
    []
  );
  const [dailyLogs, setDailyLogs] = useLocalStorage<
    Record<string, DailyLogEntry>
  >(STORAGE_KEYS.DAILY_LOGS, {});
  const [dailyTasks, setDailyTasks] = useLocalStorage<DailyTaskItem[]>(
    STORAGE_KEYS.DAILY_TASKS,
    []
  );
  const [weeklyBlocks, setWeeklyBlocks] = useLocalStorage<
    WeeklyPlanCustomBlock[]
  >(STORAGE_KEYS.WEEKLY_BLOCKS, []);
  const [pomodoroSessions, setPomodoroSessions] = useLocalStorage<
    PomodoroSessionRecord[]
  >(STORAGE_KEYS.POMODORO_SESSIONS, []);
  const [resources, setResources] = useLocalStorage<ResourceItem[]>(
    STORAGE_KEYS.RESOURCES,
    INITIAL_RESOURCES
  );
  const [streakState, setStreakState] = useLocalStorage<StreakFreezeState>(
    STORAGE_KEYS.STREAK_STATE,
    DEFAULT_STREAK_STATE
  );

  // Sync dark/light class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  const updateSettings = useCallback(
    (patch: Partial<UserSettings>) => {
      setSettings((prev) => ({ ...prev, ...patch }));
    },
    [setSettings]
  );

  const countdown = useCountdown(settings.examDate);

  // Syllabus mutations
  const updateTopicStatus = useCallback(
    (topicId: string, status: TopicStatus) => {
      const todayStr = getLocalDateString();
      setTopics((prev) =>
        prev.map((t) => {
          if (t.id !== topicId) return t;
          if (status === 'practised') {
            return {
              ...t,
              status,
              practisedDate: todayStr,
              revisionStage: 0,
              nextRevisionDate: addDays(todayStr, SPACED_REVISION_INTERVALS[0]),
            };
          }
          if (status === 'revised') {
            const nextStage = Math.min(
              (t.revisionStage ?? 0) + 1,
              SPACED_REVISION_INTERVALS.length - 1
            );
            return {
              ...t,
              status,
              lastRevisedDate: todayStr,
              revisionStage: nextStage,
              nextRevisionDate:
                t.nextRevisionDate ??
                addDays(todayStr, SPACED_REVISION_INTERVALS[nextStage]),
            };
          }
          if (status === 'not_started' || status === 'learning') {
            return {
              ...t,
              status,
              nextRevisionDate: undefined,
              revisionStage: undefined,
            };
          }
          return { ...t, status };
        })
      );
    },
    [setTopics]
  );

  const updateTopicDetails = useCallback(
    (
      topicId: string,
      patch: Partial<Pick<SyllabusTopic, 'importance' | 'videoUrl' | 'notesUrl'>>
    ) => {
      setTopics((prev) =>
        prev.map((t) => (t.id === topicId ? { ...t, ...patch } : t))
      );
    },
    [setTopics]
  );

  // PYQ mutations & computed per-topic stats
  const addPyqLog = useCallback(
    (entry: Omit<PyqLogEntry, 'id'>) => {
      const id = `pyq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setPyqLogs((prev) => [{ ...entry, id }, ...prev]);
    },
    [setPyqLogs]
  );

  const togglePyqRevisit = useCallback(
    (id: string) => {
      setPyqLogs((prev) =>
        prev.map((l) => (l.id === id ? { ...l, revisit: !l.revisit } : l))
      );
    },
    [setPyqLogs]
  );

  const deletePyqLog = useCallback(
    (id: string) => {
      setPyqLogs((prev) => prev.filter((l) => l.id !== id));
    },
    [setPyqLogs]
  );

  const adjustTopicPyqCounts = useCallback(
    (
      topicId: string,
      delta: { correct?: number; wrong?: number; skipped?: number }
    ) => {
      setManualPyqAdjustments((prev) => {
        const cur = prev[topicId] || {
          topicId,
          extraCorrect: 0,
          extraWrong: 0,
          extraSkipped: 0,
        };
        return {
          ...prev,
          [topicId]: {
            topicId,
            extraCorrect: Math.max(0, cur.extraCorrect + (delta.correct ?? 0)),
            extraWrong: Math.max(0, cur.extraWrong + (delta.wrong ?? 0)),
            extraSkipped: Math.max(0, cur.extraSkipped + (delta.skipped ?? 0)),
          },
        };
      });
    },
    [setManualPyqAdjustments]
  );

  const topicPyqStatsMap = useMemo(() => {
    const map = new Map<string, TopicPyqComputed>();
    topics.forEach((t) => {
      const manual = manualPyqAdjustments[t.id];
      map.set(t.id, {
        topicId: t.id,
        attempted: 0,
        correct: manual?.extraCorrect ?? 0,
        wrong: manual?.extraWrong ?? 0,
        skipped: manual?.extraSkipped ?? 0,
        accuracyPct: null,
        isWeak: false,
      });
    });

    pyqLogs.forEach((log) => {
      const rec = map.get(log.topicId);
      if (!rec) return;
      if (log.result === 'correct') rec.correct += 1;
      else if (log.result === 'wrong') rec.wrong += 1;
      else rec.skipped += 1;
    });

    map.forEach((rec) => {
      const graded = rec.correct + rec.wrong;
      rec.attempted = graded + rec.skipped;
      if (graded > 0) {
        rec.accuracyPct = Math.round((rec.correct / graded) * 100);
        rec.isWeak = rec.accuracyPct < 60;
      } else {
        rec.accuracyPct = null;
        rec.isWeak = false;
      }
    });

    return map;
  }, [topics, pyqLogs, manualPyqAdjustments]);

  // Mock tests
  const addMockTest = useCallback(
    (entry: Omit<MockTestEntry, 'id'>) => {
      const id = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setMockTests((prev) =>
        [...prev, { ...entry, id }].sort((a, b) => a.date.localeCompare(b.date))
      );
    },
    [setMockTests]
  );

  const deleteMockTest = useCallback(
    (id: string) => {
      setMockTests((prev) => prev.filter((m) => m.id !== id));
    },
    [setMockTests]
  );

  // Error logs
  const addErrorLog = useCallback(
    (
      entry: Omit<
        ErrorLogEntry,
        'id' | 'createdAt' | 'revisionStage' | 'nextRevisionDate'
      >
    ) => {
      const todayStr = getLocalDateString();
      const newEntry: ErrorLogEntry = {
        ...entry,
        id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        createdAt: todayStr,
        revisionStage: 0,
        nextRevisionDate: addDays(todayStr, SPACED_REVISION_INTERVALS[0]),
      };
      setErrorLogs((prev) => [newEntry, ...prev]);
    },
    [setErrorLogs]
  );

  const deleteErrorLog = useCallback(
    (id: string) => {
      setErrorLogs((prev) => prev.filter((e) => e.id !== id));
    },
    [setErrorLogs]
  );

  // Record a completed revision as a completed daily task so it counts toward today's streak
  const handleRevisionCompleted = useCallback(
    (item: RevisionQueueItem) => {
      const todayStr = getLocalDateString();
      setDailyTasks((prev) => {
        // Check if there is an existing uncompleted revision task for this topic today
        const matchIdx = prev.findIndex(
          (t) =>
            t.date === todayStr &&
            t.category === 'revision' &&
            t.topicId === item.topicId &&
            !t.completed
        );
        if (matchIdx >= 0) {
          return prev.map((t, i) =>
            i === matchIdx ? { ...t, completed: true } : t
          );
        }
        return [
          ...prev,
          {
            id: `rev_done_${Date.now()}`,
            date: todayStr,
            title: `Completed spaced revision: ${item.title}`,
            category: 'revision',
            subjectId: item.subjectId,
            topicId: item.topicId,
            completed: true,
          },
        ];
      });
    },
    [setDailyTasks]
  );

  const revisionQueue = useRevisionQueue({
    topics,
    setTopics,
    errorLogs,
    setErrorLogs,
    onRevisionCompleted: handleRevisionCompleted,
  });

  // Backward Study Phases
  const studyPhases = useMemo(
    () =>
      buildBackwardStudyPhases(
        settings.planStartDate,
        settings.examDate,
        settings.dailyGoalHours,
        topics,
        mockTests.length
      ),
    [
      settings.planStartDate,
      settings.examDate,
      settings.dailyGoalHours,
      topics,
      mockTests.length,
    ]
  );

  // Ensure Today's Plan has auto-picked 3-5 tasks seeded for today
  const todayStr = getLocalDateString();
  useEffect(() => {
    const existingForToday = dailyTasks.filter((t) => t.date === todayStr);
    if (existingForToday.length === 0 && topics.length > 0) {
      const autoTasks = generateAutoTodaysTasks(
        todayStr,
        studyPhases,
        topics,
        revisionQueue.dueTodayItems,
        pyqLogs
      );
      if (autoTasks.length > 0) {
        setDailyTasks((prev) => {
          if (prev.some((t) => t.date === todayStr)) return prev;
          return [...prev, ...autoTasks];
        });
      }
    }
  }, [
    todayStr,
    dailyTasks,
    topics,
    studyPhases,
    revisionQueue.dueTodayItems,
    pyqLogs,
    setDailyTasks,
  ]);

  const todaysTasks = useMemo(
    () => dailyTasks.filter((t) => t.date === todayStr),
    [dailyTasks, todayStr]
  );

  const toggleDailyTask = useCallback(
    (taskId: string) => {
      setDailyTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        )
      );
    },
    [setDailyTasks]
  );

  const addCustomDailyTask = useCallback(
    (title: string, subjectId?: SubjectId) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const newTask: DailyTaskItem = {
        id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        date: getLocalDateString(),
        title: trimmed,
        category: 'custom',
        subjectId,
        completed: false,
      };
      setDailyTasks((prev) => [...prev, newTask]);
    },
    [setDailyTasks]
  );

  const deleteDailyTask = useCallback(
    (taskId: string) => {
      setDailyTasks((prev) => prev.filter((t) => t.id !== taskId));
    },
    [setDailyTasks]
  );

  // Weekly custom schedule blocks
  const addWeeklyBlock = useCallback(
    (block: Omit<WeeklyPlanCustomBlock, 'id'>) => {
      setWeeklyBlocks((prev) => [
        ...prev,
        {
          ...block,
          id: `wb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        },
      ]);
    },
    [setWeeklyBlocks]
  );

  const toggleWeeklyBlock = useCallback(
    (id: string) => {
      setWeeklyBlocks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, completed: !b.completed } : b))
      );
    },
    [setWeeklyBlocks]
  );

  const deleteWeeklyBlock = useCallback(
    (id: string) => {
      setWeeklyBlocks((prev) => prev.filter((b) => b.id !== id));
    },
    [setWeeklyBlocks]
  );

  // Daily Logs
  const upsertDailyLog = useCallback(
    (entry: DailyLogEntry) => {
      setDailyLogs((prev) => ({
        ...prev,
        [entry.date]: entry,
      }));
    },
    [setDailyLogs]
  );

  const addStudyHours = useCallback(
    (dateStr: string, subjectId: SubjectId, hoursDelta: number) => {
      setDailyLogs((prev) => {
        const existing = prev[dateStr] ?? {
          date: dateStr,
          subjectHours: createEmptySubjectHours(),
          mood: 4 as const,
          whatILearned: '',
          whatConfusedMe: '',
        };
        const updatedHours = Math.max(
          0,
          Math.round(
            ((existing.subjectHours[subjectId] || 0) + hoursDelta) * 100
          ) / 100
        );
        return {
          ...prev,
          [dateStr]: {
            ...existing,
            subjectHours: {
              ...existing.subjectHours,
              [subjectId]: updatedHours,
            },
          },
        };
      });
    },
    [setDailyLogs]
  );

  // Streak Engine
  const streak = useStreak({
    dailyLogs,
    dailyTasks,
    weeklyBlocks,
    streakState,
    setStreakState,
  });

  // Global Pomodoro Timer (persists across route switches and auto-credits hours)
  const [pomodoroMode, setPomodoroMode] = useState<PomodoroMode>('focus');
  const [secondsLeft, setSecondsLeft] = useState<number>(FOCUS_DURATION_SEC);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedSubject, setSelectedSubject] =
    useState<SubjectId>('prob_stats');

  const soundEnabledRef = useRef(settings.soundEnabled);
  soundEnabledRef.current = settings.soundEnabled;
  const selectedSubjectRef = useRef(selectedSubject);
  selectedSubjectRef.current = selectedSubject;

  const creditCompletedFocusSession = useCallback(
    (durationMinutes: number) => {
      const dStr = getLocalDateString();
      const subj = selectedSubjectRef.current;
      addStudyHours(dStr, subj, durationMinutes / 60);
      setPomodoroSessions((prev) => [
        {
          id: `pomo_${Date.now()}`,
          date: dStr,
          subjectId: subj,
          durationMin: durationMinutes,
          completedAt: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        ...prev,
      ]);
      if (soundEnabledRef.current) {
        playCompletionChime();
      }
    },
    [addStudyHours, setPomodoroSessions]
  );

  useEffect(() => {
    if (!isRunning) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (pomodoroMode === 'focus') {
            creditCompletedFocusSession(25);
            setPomodoroMode('break');
            return BREAK_DURATION_SEC;
          } else {
            if (soundEnabledRef.current) playCompletionChime();
            setPomodoroMode('focus');
            return FOCUS_DURATION_SEC;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isRunning, pomodoroMode, creditCompletedFocusSession]);

  const handleSetPomodoroMode = useCallback((m: PomodoroMode) => {
    setIsRunning(false);
    setPomodoroMode(m);
    setSecondsLeft(m === 'focus' ? FOCUS_DURATION_SEC : BREAK_DURATION_SEC);
  }, []);

  const toggleStartPause = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(
      pomodoroMode === 'focus' ? FOCUS_DURATION_SEC : BREAK_DURATION_SEC
    );
  }, [pomodoroMode]);

  const completeEarlyAndCredit = useCallback(() => {
    if (pomodoroMode !== 'focus') return;
    const elapsedSec = FOCUS_DURATION_SEC - secondsLeft;
    const elapsedMin = Math.max(1, Math.round(elapsedSec / 60));
    setIsRunning(false);
    creditCompletedFocusSession(elapsedMin);
    setPomodoroMode('break');
    setSecondsLeft(BREAK_DURATION_SEC);
  }, [pomodoroMode, secondsLeft, creditCompletedFocusSession]);

  // Resources
  const addResource = useCallback(
    (item: Omit<ResourceItem, 'id' | 'addedDate'>) => {
      setResources((prev) => [
        {
          ...item,
          id: `res_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          addedDate: getLocalDateString(),
        },
        ...prev,
      ]);
    },
    [setResources]
  );

  const deleteResource = useCallback(
    (id: string) => {
      setResources((prev) => prev.filter((r) => r.id !== id));
    },
    [setResources]
  );

  // Backup / Restore / Reset / Demo
  const exportAllJson = useCallback(() => {
    return JSON.stringify(getStorage().exportAll(), null, 2);
  }, []);

  const importAllJson = useCallback(
    (rawJson: string): { ok: boolean; message: string } => {
      try {
        const parsed = JSON.parse(rawJson);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          return { ok: false, message: 'Invalid JSON backup structure.' };
        }
        getStorage().importAll(parsed as Record<string, unknown>);
        return {
          ok: true,
          message: 'Backup imported cleanly across all modules.',
        };
      } catch {
        return {
          ok: false,
          message: 'Could not parse JSON file. Ensure it is a valid export.',
        };
      }
    },
    []
  );

  const resetAllData = useCallback(() => {
    getStorage().clearAll();
    setSettings(DEFAULT_SETTINGS);
    setTopics(INITIAL_SYLLABUS_TOPICS);
    setResources(INITIAL_RESOURCES);
    setStreakState(DEFAULT_STREAK_STATE);
  }, [setSettings, setTopics, setResources, setStreakState]);

  const loadDemoData = useCallback(() => {
    const demoSnapshot = createDemoSnapshot();
    getStorage().clearAll();
    getStorage().importAll(demoSnapshot);
  }, []);

  const value: AppStateContextValue = {
    activePage,
    setActivePage,
    settings,
    updateSettings,
    countdown,
    topics,
    updateTopicStatus,
    updateTopicDetails,
    pyqLogs,
    addPyqLog,
    togglePyqRevisit,
    deletePyqLog,
    manualPyqAdjustments,
    adjustTopicPyqCounts,
    topicPyqStatsMap,
    mockTests,
    addMockTest,
    deleteMockTest,
    errorLogs,
    addErrorLog,
    deleteErrorLog,
    revisionQueue,
    studyPhases,
    todaysTasks,
    toggleDailyTask,
    addCustomDailyTask,
    deleteDailyTask,
    weeklyBlocks,
    addWeeklyBlock,
    toggleWeeklyBlock,
    deleteWeeklyBlock,
    dailyLogs,
    upsertDailyLog,
    addStudyHours,
    streak,
    pomodoro: {
      mode: pomodoroMode,
      secondsLeft,
      isRunning,
      selectedSubject,
      sessions: pomodoroSessions,
      setSelectedSubject,
      setMode: handleSetPomodoroMode,
      toggleStartPause,
      resetTimer,
      completeEarlyAndCredit,
    },
    resources,
    addResource,
    deleteResource,
    exportAllJson,
    importAllJson,
    resetAllData,
    loadDemoData,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used inside AppStateProvider');
  }
  return ctx;
}

export { SUBJECTS };
