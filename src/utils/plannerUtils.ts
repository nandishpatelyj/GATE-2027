import {
  DailyTaskItem,
  RevisionQueueItem,
  StudyPhase,
  SubjectId,
  SyllabusTopic,
  PyqLogEntry,
} from '../types';
import { addDays, diffDays } from './dateUtils';
import { SUBJECT_MAP } from '../data/syllabus';

interface PhaseBlueprint {
  phase: 1 | 2 | 3 | 4 | 5;
  title: string;
  subtitle: string;
  subjects: SubjectId[];
  weight: number; // share of total timeline
}

const PHASE_BLUEPRINTS: PhaseBlueprint[] = [
  {
    phase: 1,
    title: 'Phase 1: Math Foundation',
    subtitle: 'Probability & Statistics, Linear Algebra, Calculus & Optimization + Aptitude warmup',
    subjects: ['prob_stats', 'linear_algebra', 'calculus_opt', 'general_aptitude'],
    weight: 0.28,
  },
  {
    phase: 2,
    title: 'Phase 2: Programming, DSA & DBMS',
    subtitle: 'Python recursion/structures, sorting, graph algorithms, SQL, normal forms & warehousing',
    subjects: ['prog_dsa', 'dbms_warehouse'],
    weight: 0.22,
  },
  {
    phase: 3,
    title: 'Phase 3: Machine Learning',
    subtitle: 'Supervised & unsupervised learning, bias-variance, cross-validation, MLP & PCA',
    subjects: ['machine_learning'],
    weight: 0.20,
  },
  {
    phase: 4,
    title: 'Phase 4: Artificial Intelligence',
    subtitle: 'Search algorithms, propositional & predicate logic, Bayesian networks & inference',
    subjects: ['artificial_intelligence'],
    weight: 0.12,
  },
  {
    phase: 5,
    title: 'Phase 5: Mocks & Final Revision',
    subtitle: 'Full-length timed mocks, weak-topic PYQ drills, mistake notebook & spaced revision',
    subjects: [
      'prob_stats',
      'linear_algebra',
      'calculus_opt',
      'prog_dsa',
      'dbms_warehouse',
      'machine_learning',
      'artificial_intelligence',
      'general_aptitude',
    ],
    weight: 0.18,
  },
];

/**
 * Generates the 5-phase study schedule working backward from `examDate` to `anchorStartDate`.
 * Automatically scales phase durations whenever `examDate`, `planStartDate`, or `dailyGoalHours` changes.
 */
export function buildBackwardStudyPhases(
  planStartDate: string,
  examDate: string,
  dailyGoalHours: number,
  topics: SyllabusTopic[],
  mocksCount: number
): StudyPhase[] {
  const rawTotalDays = diffDays(planStartDate, examDate);
  const totalDays = Math.max(10, rawTotalDays);

  // Compute day allocations working backward from examDate so end of Phase 5 = day before examDate
  const dayCounts = PHASE_BLUEPRINTS.map((bp) =>
    Math.max(2, Math.round(totalDays * bp.weight))
  );
  const allocatedSum = dayCounts.reduce((a, b) => a + b, 0);
  dayCounts[0] = Math.max(2, dayCounts[0] + (totalDays - allocatedSum));

  let cursorEnd = addDays(examDate, -1);
  const phasesReversed: StudyPhase[] = [];

  for (let i = PHASE_BLUEPRINTS.length - 1; i >= 0; i--) {
    const bp = PHASE_BLUEPRINTS[i];
    const days = dayCounts[i];
    const startDate = i === 0 ? planStartDate : addDays(cursorEnd, -(days - 1));
    const actualDays = Math.max(1, diffDays(startDate, cursorEnd) + 1);

    // Compute phase completion %
    let completionPct = 0;
    if (bp.phase < 5) {
      const phaseTopics = topics.filter((t) => bp.subjects.includes(t.subjectId));
      if (phaseTopics.length > 0) {
        const score = phaseTopics.reduce((sum, t) => {
          if (t.status === 'revised') return sum + 1;
          if (t.status === 'practised') return sum + 0.8;
          if (t.status === 'learning') return sum + 0.4;
          return sum;
        }, 0);
        completionPct = Math.round((score / phaseTopics.length) * 100);
      }
    } else {
      // Phase 5 completion blends revised topics % and mock target (e.g. 8 mocks)
      const revisedCount = topics.filter(
        (t) => t.status === 'revised' || t.status === 'practised'
      ).length;
      const revRatio = topics.length ? revisedCount / topics.length : 0;
      const mockRatio = Math.min(1, mocksCount / 8);
      completionPct = Math.round((revRatio * 0.6 + mockRatio * 0.4) * 100);
    }

    phasesReversed.push({
      phase: bp.phase,
      title: bp.title,
      subtitle: bp.subtitle,
      subjects: bp.subjects,
      startDate,
      endDate: cursorEnd,
      totalDays: actualDays,
      plannedHours: Math.round(actualDays * dailyGoalHours * 10) / 10,
      completionPct,
    });

    cursorEnd = addDays(startDate, -1);
  }

  return phasesReversed.reverse();
}

export function getActivePhaseForDate(
  dateStr: string,
  phases: StudyPhase[]
): StudyPhase {
  const match = phases.find(
    (p) => dateStr >= p.startDate && dateStr <= p.endDate
  );
  if (match) return match;
  if (phases.length > 0 && dateStr < phases[0].startDate) return phases[0];
  return phases[phases.length - 1];
}

/**
 * Auto-picks 4 focused tasks for Today's Plan based on:
 * 1. Due spaced revision items
 * 2. Active Study Phase next High/Medium topic to learn
 * 3. PYQ practice on a weak or currently-learning topic
 * 4. Secondary concept/aptitude drill
 */
export function generateAutoTodaysTasks(
  todayStr: string,
  phases: StudyPhase[],
  topics: SyllabusTopic[],
  dueRevisions: RevisionQueueItem[],
  pyqLogs: PyqLogEntry[]
): DailyTaskItem[] {
  const tasks: DailyTaskItem[] = [];
  const activePhase = getActivePhaseForDate(todayStr, phases);

  // 1. Up to 2 due spaced revision items first
  dueRevisions.slice(0, 2).forEach((rev, idx) => {
    tasks.push({
      id: `auto_${todayStr}_rev_${rev.id}_${idx}`,
      date: todayStr,
      title: `Revise: ${rev.title} (${SUBJECT_MAP[rev.subjectId].shortName})`,
      category: 'revision',
      subjectId: rev.subjectId,
      topicId: rev.topicId,
      completed: false,
      isAutoGenerated: true,
    });
  });

  // 2. Pick primary topic to study from active phase (prioritizing 'learning' then 'not_started' + High importance)
  const phaseCandidates = topics
    .filter(
      (t) =>
        activePhase.subjects.includes(t.subjectId) &&
        (t.status === 'learning' || t.status === 'not_started')
    )
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'learning' ? -1 : 1;
      const impRank = { High: 0, Medium: 1, Low: 2 };
      return impRank[a.importance] - impRank[b.importance];
    });

  const studyTopic =
    phaseCandidates[0] ||
    topics.find((t) => t.status === 'learning' || t.status === 'not_started');

  if (studyTopic) {
    tasks.push({
      id: `auto_${todayStr}_study_${studyTopic.id}`,
      date: todayStr,
      title: `Study concept: ${studyTopic.title}`,
      category: 'study',
      subjectId: studyTopic.subjectId,
      topicId: studyTopic.id,
      completed: false,
      isAutoGenerated: true,
    });
  }

  // 3. Pick a PYQ practice target (weak topic <60% accuracy, or a 'learning'/'practised' topic, or phase candidate)
  const topicAccuracyMap = new Map<string, { total: number; correct: number }>();
  pyqLogs.forEach((l) => {
    if (l.result === 'skipped') return;
    const cur = topicAccuracyMap.get(l.topicId) || { total: 0, correct: 0 };
    cur.total += 1;
    if (l.result === 'correct') cur.correct += 1;
    topicAccuracyMap.set(l.topicId, cur);
  });

  const weakTopic = topics.find((t) => {
    const st = topicAccuracyMap.get(t.id);
    return st && st.total >= 2 && st.correct / st.total < 0.6;
  });

  const pyqTarget =
    weakTopic ||
    topics.find((t) => t.status === 'learning' && t.id !== studyTopic?.id) ||
    phaseCandidates[1] ||
    studyTopic;

  if (pyqTarget) {
    tasks.push({
      id: `auto_${todayStr}_pyq_${pyqTarget.id}`,
      date: todayStr,
      title: `Solve 10 PYQs: ${pyqTarget.title}`,
      category: 'pyq',
      subjectId: pyqTarget.subjectId,
      topicId: pyqTarget.id,
      completed: false,
      isAutoGenerated: true,
    });
  }

  // 4. Ensure at least 4 tasks (up to 5 max) by adding a complementary phase or General Aptitude task
  if (tasks.length < 4) {
    const secondaryCandidate =
      phaseCandidates.find(
        (t) => t.id !== studyTopic?.id && t.id !== pyqTarget?.id
      ) ||
      topics.find((t) => t.subjectId === 'general_aptitude' && t.status !== 'revised');

    if (secondaryCandidate) {
      tasks.push({
        id: `auto_${todayStr}_sec_${secondaryCandidate.id}`,
        date: todayStr,
        title: `Practice notes & examples: ${secondaryCandidate.title}`,
        category: 'study',
        subjectId: secondaryCandidate.subjectId,
        topicId: secondaryCandidate.id,
        completed: false,
        isAutoGenerated: true,
      });
    }
  }

  return tasks.slice(0, 5);
}
