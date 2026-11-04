import { INITIAL_SYLLABUS_TOPICS } from './syllabus';
import { INITIAL_RESOURCES } from './resources';
import { addDays, getLocalDateString } from '../utils/dateUtils';
import { STORAGE_KEYS } from '../utils/storage';
import {
  DailyLogEntry,
  DailyTaskItem,
  ErrorLogEntry,
  MockTestEntry,
  PyqLogEntry,
  StreakFreezeState,
  SubjectId,
  SyllabusTopic,
  UserSettings,
} from '../types';

const EMPTY_SUBJECT_HOURS: Record<SubjectId, number> = {
  prob_stats: 0,
  linear_algebra: 0,
  calculus_opt: 0,
  prog_dsa: 0,
  dbms_warehouse: 0,
  machine_learning: 0,
  artificial_intelligence: 0,
  general_aptitude: 0,
};

export function createDemoSnapshot(): Record<string, unknown> {
  const today = getLocalDateString();

  // 1. Settings
  const settings: UserSettings = {
    examDate: '2027-02-06',
    planStartDate: addDays(today, -35),
    dailyGoalHours: 4.5,
    targetScore: 65,
    theme: 'dark',
    soundEnabled: true,
  };

  // 2. Syllabus with realistic progress
  const practisedIds = new Set([
    'ps_01', 'ps_02', 'ps_03', 'ps_04', 'ps_05',
    'la_01', 'la_02', 'la_03', 'la_04', 'la_07',
    'co_01', 'co_02', 'dsa_01', 'dsa_02', 'ml_01', 'ga_02',
  ]);
  const revisedIds = new Set(['ps_01', 'ps_02', 'la_01', 'la_02', 'dsa_01']);
  const learningIds = new Set([
    'ps_06', 'ps_08', 'la_08', 'la_12', 'co_04',
    'dsa_05', 'db_05', 'ml_02', 'ml_06', 'ai_02',
  ]);

  const syllabus: SyllabusTopic[] = INITIAL_SYLLABUS_TOPICS.map((t, idx) => {
    if (revisedIds.has(t.id)) {
      return {
        ...t,
        status: 'revised',
        practisedDate: addDays(today, -14),
        lastRevisedDate: addDays(today, -6),
        revisionStage: 2,
        nextRevisionDate: idx % 2 === 0 ? today : addDays(today, 2),
      };
    }
    if (practisedIds.has(t.id)) {
      return {
        ...t,
        status: 'practised',
        practisedDate: addDays(today, -3),
        revisionStage: 1,
        nextRevisionDate: idx % 3 === 0 ? today : addDays(today, 1),
      };
    }
    if (learningIds.has(t.id)) {
      return { ...t, status: 'learning' };
    }
    return t;
  });

  // 3. PYQ Logs (including weak topics <60% and strong topics >75%)
  const pyqLogs: PyqLogEntry[] = [
    { id: 'p1', date: addDays(today, -9), source: 'GATE DA 2024', subjectId: 'prob_stats', topicId: 'ps_05', questionRef: 'Q.14 Conditional Bayes', result: 'correct', timeTakenSec: 110, revisit: false },
    { id: 'p2', date: addDays(today, -9), source: 'GATE DA 2024', subjectId: 'prob_stats', topicId: 'ps_05', questionRef: 'Q.29 Posterior Odds', result: 'correct', timeTakenSec: 145, revisit: false },
    { id: 'p3', date: addDays(today, -8), source: 'GATE DA 2025', subjectId: 'linear_algebra', topicId: 'la_07', questionRef: 'Q.19 Algebraic vs Geometric Multiplicity', result: 'correct', timeTakenSec: 95, revisit: false },
    { id: 'p4', date: addDays(today, -7), source: 'GATE DA 2025', subjectId: 'linear_algebra', topicId: 'la_12', questionRef: 'Q.44 Low-Rank SVD Frobenius Error', result: 'wrong', timeTakenSec: 210, revisit: true },
    { id: 'p5', date: addDays(today, -7), source: 'GATE DA 2026', subjectId: 'linear_algebra', topicId: 'la_12', questionRef: 'Q.38 Singular Values of A^T A', result: 'wrong', timeTakenSec: 185, revisit: true },
    { id: 'p6', date: addDays(today, -6), source: 'GATE Overflow', subjectId: 'linear_algebra', topicId: 'la_12', questionRef: 'GO-118 Pseudo-inverse SVD', result: 'correct', timeTakenSec: 160, revisit: false },
    { id: 'p7', date: addDays(today, -5), source: 'GATE DA 2024', subjectId: 'machine_learning', topicId: 'ml_06', questionRef: 'Q.48 Soft-Margin SVM Dual', result: 'wrong', timeTakenSec: 240, revisit: true },
    { id: 'p8', date: addDays(today, -5), source: 'GATE DA 2025', subjectId: 'machine_learning', topicId: 'ml_06', questionRef: 'Q.51 Kernel Trick Polynomial', result: 'wrong', timeTakenSec: 195, revisit: true },
    { id: 'p9', date: addDays(today, -4), source: 'GATE DA 2026', subjectId: 'prog_dsa', topicId: 'dsa_01', questionRef: 'Q.11 Python Closure Output', result: 'correct', timeTakenSec: 75, revisit: false },
    { id: 'p10', date: addDays(today, -3), source: 'GATE DA 2026', subjectId: 'prog_dsa', topicId: 'dsa_09', questionRef: 'Q.26 Quicksort Worst-Case Recurrence', result: 'correct', timeTakenSec: 90, revisit: false },
    { id: 'p11', date: addDays(today, -2), source: 'GATE DA 2025', subjectId: 'dbms_warehouse', topicId: 'db_05', questionRef: 'Q.33 Correlated Subquery Group By', result: 'correct', timeTakenSec: 130, revisit: false },
    { id: 'p12', date: addDays(today, -1), source: 'GATE DA 2026', subjectId: 'artificial_intelligence', topicId: 'ai_02', questionRef: 'Q.41 A* Heuristic Consistency', result: 'correct', timeTakenSec: 120, revisit: false },
    { id: 'p13', date: addDays(today, -1), source: 'Test Series', subjectId: 'calculus_opt', topicId: 'co_04', questionRef: 'TS-09 2nd Order Taylor Remainder', result: 'wrong', timeTakenSec: 170, revisit: true },
    { id: 'p14', date: addDays(today, -1), source: 'GATE DA 2024', subjectId: 'general_aptitude', topicId: 'ga_02', questionRef: 'GA-07 Ratio & Mixture', result: 'correct', timeTakenSec: 65, revisit: false },
  ];

  // 4. Mock Tests
  const mockTests: MockTestEntry[] = [
    {
      id: 'm1',
      name: 'GATE DA Diagnostic Full Mock #1',
      date: addDays(today, -24),
      marks: 44.33,
      maxMarks: 100,
      rank: 840,
      timeSpentMin: 174,
      subjectMarks: {
        prob_stats: 7.5,
        linear_algebra: 5.5,
        calculus_opt: 3.0,
        prog_dsa: 8.0,
        dbms_warehouse: 3.33,
        machine_learning: 6.0,
        artificial_intelligence: 3.0,
        general_aptitude: 8.0,
      },
    },
    {
      id: 'm2',
      name: 'AIMT Data Science & AI Series #2',
      date: addDays(today, -16),
      marks: 51.67,
      maxMarks: 100,
      rank: 512,
      timeSpentMin: 178,
      subjectMarks: {
        prob_stats: 9.0,
        linear_algebra: 6.67,
        calculus_opt: 4.0,
        prog_dsa: 9.5,
        dbms_warehouse: 4.5,
        machine_learning: 7.5,
        artificial_intelligence: 4.5,
        general_aptitude: 6.0,
      },
    },
    {
      id: 'm3',
      name: 'AIMT Data Science & AI Series #3',
      date: addDays(today, -9),
      marks: 57.0,
      maxMarks: 100,
      rank: 318,
      timeSpentMin: 176,
      subjectMarks: {
        prob_stats: 10.5,
        linear_algebra: 7.5,
        calculus_opt: 5.0,
        prog_dsa: 10.0,
        dbms_warehouse: 5.0,
        machine_learning: 8.5,
        artificial_intelligence: 5.5,
        general_aptitude: 5.0,
      },
    },
    {
      id: 'm4',
      name: 'All-India Open GATE DA Mock #4',
      date: addDays(today, -2),
      marks: 62.33,
      maxMarks: 100,
      rank: 184,
      timeSpentMin: 179,
      subjectMarks: {
        prob_stats: 11.5,
        linear_algebra: 8.0,
        calculus_opt: 5.5,
        prog_dsa: 11.0,
        dbms_warehouse: 5.33,
        machine_learning: 9.5,
        artificial_intelligence: 6.0,
        general_aptitude: 5.5,
      },
    },
  ];

  // 5. Error Logs
  const errorLogs: ErrorLogEntry[] = [
    {
      id: 'e1',
      createdAt: addDays(today, -7),
      subjectId: 'linear_algebra',
      topicId: 'la_12',
      questionSummary: 'Confused singular values σ_i of A with eigenvalues of A^T A',
      whatWentWrong: 'Forgot to take square root of eigenvalues of A^T A when computing Frobenius norm of rank-k approximation error.',
      mistakeType: 'Concept gap',
      correctApproach: 'σ_i(A) = sqrt(λ_i(A^T A)). The rank-k Frobenius error ||A - A_k||_F equals sqrt(sum_{i>k} σ_i^2).',
      revisionStage: 1,
      nextRevisionDate: today,
    },
    {
      id: 'e2',
      createdAt: addDays(today, -5),
      subjectId: 'machine_learning',
      topicId: 'ml_06',
      questionSummary: 'KKT complementary slackness condition on margin vs non-margin support vectors',
      whatWentWrong: 'Assumed α_i = C for points lying strictly on the margin hyperplane y_i(w^T x_i + b) = 1.',
      mistakeType: 'Concept gap',
      correctApproach: 'If 0 < α_i < C, then ξ_i = 0 and the point lies exactly on the margin. Only when α_i = C can ξ_i > 0.',
      revisionStage: 1,
      nextRevisionDate: today,
    },
    {
      id: 'e3',
      createdAt: addDays(today, -3),
      subjectId: 'prob_stats',
      topicId: 'ps_09',
      questionSummary: 'Variance of exponential distribution parameter λ = 0.5',
      whatWentWrong: 'Used Var(X) = 1/λ instead of 1/λ^2 under exam timer pressure.',
      mistakeType: 'Silly',
      correctApproach: 'For X ~ Exp(λ) with rate λ, E[X] = 1/λ and Var(X) = 1/λ^2 = 4.',
      revisionStage: 0,
      nextRevisionDate: addDays(today, 1),
    },
    {
      id: 'e4',
      createdAt: addDays(today, -2),
      subjectId: 'dbms_warehouse',
      topicId: 'db_05',
      questionSummary: 'NULL handling in SQL NOT IN vs NOT EXISTS',
      whatWentWrong: 'Missed that inner subquery column was nullable, returning empty result set with NOT IN.',
      mistakeType: 'Misread',
      correctApproach: 'x NOT IN (a, b, NULL) evaluates to UNKNOWN (false in WHERE). Always verify NULL constraints or rewrite with NOT EXISTS.',
      revisionStage: 0,
      nextRevisionDate: today,
    },
  ];

  // 6. Daily Logs across last 28 days (creating a 9-day current streak ending yesterday!)
  const dailyLogs: Record<string, DailyLogEntry> = {};
  for (let offset = -32; offset <= -1; offset++) {
    // Leave a gap at -11 and -20 to look authentic, freeze at -5
    if (offset === -11 || offset === -20 || offset === -21 || offset === -5) continue;
    const d = addDays(today, offset);
    const base = 1.5 + ((Math.abs(offset) * 7) % 4) * 0.75;
    dailyLogs[d] = {
      date: d,
      subjectHours: {
        ...EMPTY_SUBJECT_HOURS,
        prob_stats: Number((base * 0.35).toFixed(2)),
        linear_algebra: Number((base * 0.25).toFixed(2)),
        machine_learning: Number((base * 0.25).toFixed(2)),
        prog_dsa: Number((base * 0.15).toFixed(2)),
      },
      mood: (((Math.abs(offset) % 3) + 3) as 3 | 4 | 5),
      whatILearned:
        offset === -1
          ? 'Derived SVD rank-k Eckart-Young theorem and solved 12 GATE DA 2025 linear algebra PYQs.'
          : 'Practised core concepts, worked through PYQ sets, and updated formula summary.',
      whatConfusedMe:
        offset === -1
          ? 'Need faster intuition on positive semi-definite quadratic form edge cases.'
          : 'Subtle edge cases in conditional independence d-separation.',
    };
  }

  const streakState: StreakFreezeState = {
    frozenDates: [addDays(today, -5)],
    unlockedBadgeDays: [7],
  };

  const dailyTasks: DailyTaskItem[] = [];

  return {
    [STORAGE_KEYS.SETTINGS]: settings,
    [STORAGE_KEYS.SYLLABUS]: syllabus,
    [STORAGE_KEYS.PYQ_LOGS]: pyqLogs,
    [STORAGE_KEYS.MOCK_TESTS]: mockTests,
    [STORAGE_KEYS.ERROR_LOGS]: errorLogs,
    [STORAGE_KEYS.DAILY_LOGS]: dailyLogs,
    [STORAGE_KEYS.DAILY_TASKS]: dailyTasks,
    [STORAGE_KEYS.RESOURCES]: INITIAL_RESOURCES,
    [STORAGE_KEYS.STREAK_STATE]: streakState,
  };
}
