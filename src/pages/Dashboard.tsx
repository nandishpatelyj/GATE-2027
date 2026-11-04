import React, { useMemo, useState, useEffect } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  AlertCircle,
  Check,
  Plus,
  Trash2,
  ShieldCheck,
  Award,
  ArrowRight,
} from 'lucide-react';
import { useAppState, SUBJECTS } from '../context/AppStateContext';
import { Heatmap } from '../components/Heatmap';
import { STREAK_BADGES } from '../data/badges';
import { SUBJECT_MAP } from '../data/syllabus';
import {
  formatShortDate,
  getLocalDateString,
  getWeekDatesMondayFirst,
  isAfter6PM,
} from '../utils/dateUtils';
import { getActivePhaseForDate } from '../utils/plannerUtils';

export const Dashboard: React.FC = () => {
  const {
    settings,
    countdown,
    topics,
    topicPyqStatsMap,
    mockTests,
    todaysTasks,
    toggleDailyTask,
    addCustomDailyTask,
    deleteDailyTask,
    dailyLogs,
    streak,
    studyPhases,
    revisionQueue,
    setActivePage,
    loadDemoData,
  } = useAppState();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [freezeNotice, setFreezeNotice] = useState<string | null>(null);
  const [afterSixPm, setAfterSixPm] = useState<boolean>(() => isAfter6PM());

  useEffect(() => {
    const id = window.setInterval(() => {
      setAfterSixPm(isAfter6PM());
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const todayStr = getLocalDateString();
  const activePhase = useMemo(
    () => getActivePhaseForDate(todayStr, studyPhases),
    [todayStr, studyPhases]
  );

  // Hours studied this week (Mon..Sun)
  const hoursThisWeek = useMemo(() => {
    const weekDates = getWeekDatesMondayFirst(todayStr);
    const sumMinutes = weekDates.reduce((acc, d) => {
      const rec = streak.activityByDate.get(d);
      return acc + (rec?.minutesStudied ?? 0);
    }, 0);
    return Math.round((sumMinutes / 60) * 10) / 10;
  }, [todayStr, streak.activityByDate]);

  // Syllabus coverage %
  const syllabusStats = useMemo(() => {
    const total = topics.length || 1;
    let weighted = 0;
    let completedOrPractised = 0;
    topics.forEach((t) => {
      if (t.status === 'revised') {
        weighted += 1;
        completedOrPractised += 1;
      } else if (t.status === 'practised') {
        weighted += 0.85;
        completedOrPractised += 1;
      } else if (t.status === 'learning') {
        weighted += 0.35;
      }
    });
    return {
      pct: Math.round((weighted / total) * 100),
      masteredCount: completedOrPractised,
      totalCount: topics.length,
    };
  }, [topics]);

  // PYQs solved & overall accuracy
  const pyqSummary = useMemo(() => {
    let solved = 0;
    let correct = 0;
    let graded = 0;
    topicPyqStatsMap.forEach((rec) => {
      solved += rec.correct + rec.wrong;
      correct += rec.correct;
      graded += rec.correct + rec.wrong;
    });
    const acc = graded > 0 ? Math.round((correct / graded) * 100) : null;
    return { solved, acc };
  }, [topicPyqStatsMap]);

  // Average mock score
  const avgMockScore = useMemo(() => {
    if (mockTests.length === 0) return null;
    const sum = mockTests.reduce((acc, m) => acc + m.marks, 0);
    return Math.round((sum / mockTests.length) * 10) / 10;
  }, [mockTests]);

  // Subject-wise Radar Chart data (blending PYQ accuracy + Mock subject % + Syllabus mastery fallback)
  const radarData = useMemo(() => {
    return SUBJECTS.map((subj) => {
      // 1. PYQ accuracy for subject
      const subjTopics = topics.filter((t) => t.subjectId === subj.id);
      let pyqCorrect = 0;
      let pyqGraded = 0;
      subjTopics.forEach((t) => {
        const st = topicPyqStatsMap.get(t.id);
        if (st) {
          pyqCorrect += st.correct;
          pyqGraded += st.correct + st.wrong;
        }
      });
      const pyqScore = pyqGraded > 0 ? (pyqCorrect / pyqGraded) * 100 : null;

      // 2. Mock subject score normalized against expectedMarks
      let mockScorePct: number | null = null;
      if (mockTests.length > 0 && subj.expectedMarks > 0) {
        const avgSubjMarks =
          mockTests.reduce(
            (s, m) => s + (m.subjectMarks?.[subj.id] ?? 0),
            0
          ) / mockTests.length;
        mockScorePct = Math.min(
          100,
          Math.max(0, (avgSubjMarks / subj.expectedMarks) * 100)
        );
      }

      // 3. Syllabus progress baseline
      const sylScore =
        subjTopics.length > 0
          ? (subjTopics.reduce((s, t) => {
              if (t.status === 'revised') return s + 1;
              if (t.status === 'practised') return s + 0.8;
              if (t.status === 'learning') return s + 0.35;
              return s;
            }, 0) /
              subjTopics.length) *
            100
          : 0;

      let strength = 0;
      if (pyqScore !== null && mockScorePct !== null) {
        strength = pyqScore * 0.5 + mockScorePct * 0.5;
      } else if (pyqScore !== null) {
        strength = pyqScore * 0.75 + sylScore * 0.25;
      } else if (mockScorePct !== null) {
        strength = mockScorePct * 0.75 + sylScore * 0.25;
      } else {
        strength = sylScore;
      }

      return {
        subject: subj.shortName,
        strength: Math.round(strength),
        pyqAcc: pyqScore !== null ? `${Math.round(pyqScore)}%` : 'No PYQs',
        mockPct:
          mockScorePct !== null ? `${Math.round(mockScorePct)}%` : 'No Mocks',
      };
    });
  }, [topics, topicPyqStatsMap, mockTests]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addCustomDailyTask(newTaskTitle);
    setNewTaskTitle('');
  };

  const handleApplyFreeze = (dateToFreeze: string) => {
    const res = streak.applyStreakFreeze(dateToFreeze);
    setFreezeNotice(res.message);
    window.setTimeout(() => setFreezeNotice(null), 4000);
  };

  const todayMinutes =
    streak.activityByDate.get(todayStr)?.minutesStudied ?? 0;

  return (
    <div className="space-y-6">
      {/* Post-6 PM Warning Banner when no activity logged today */}
      {afterSixPm && !streak.isTodayActive && (
        <div
          role="alert"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">
                No study activity logged yet today (past 6:00 PM)
              </p>
              <p className="text-xs text-amber-800/90 dark:text-amber-200/80 mt-0.5">
                Log at least 30 minutes of study or complete one task from Today&apos;s Plan to protect your streak.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActivePage('pomodoro')}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors whitespace-nowrap shrink-0"
            >
              Start 25m Session
            </button>
            <button
              type="button"
              onClick={() => setActivePage('daily_log')}
              className="px-3.5 py-2 text-xs font-medium rounded-lg border border-amber-600/40 hover:bg-amber-500/15 transition-colors whitespace-nowrap shrink-0"
            >
              Log Hours
            </button>
          </div>
        </div>
      )}

      {/* Dominant Focal Anchor: Countdown & Active Phase Banner */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              GATE 2027 Data Science &amp; AI · Exam Date{' '}
              {formatShortDate(settings.examDate)} · {activePhase?.title}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
              {countdown.isPast
                ? 'GATE 2027 Examination Window Concluded'
                : countdown.isExamDay
                ? 'Examination Day — Trust Your Preparation'
                : 'Countdown to GATE 2027 DA'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Daily target: {settings.dailyGoalHours}h/day · Today logged:{' '}
              <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-200">
                {(todayMinutes / 60).toFixed(1)}h
              </span>{' '}
              · Due revisions:{' '}
              <span className="font-mono tabular-nums font-medium text-teal-600 dark:text-teal-400">
                {revisionQueue.dueTodayItems.length}
              </span>
            </p>
          </div>

          <div className="flex items-baseline gap-6 sm:gap-8 shrink-0">
            <div>
              <div className="text-4xl sm:text-5xl font-bold font-mono tabular-nums tracking-tight text-teal-600 dark:text-teal-400">
                {countdown.days}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Days
              </div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-bold font-mono tabular-nums tracking-tight text-slate-900 dark:text-white">
                {String(countdown.hours).padStart(2, '0')}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Hours
              </div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-bold font-mono tabular-nums tracking-tight text-slate-500 dark:text-slate-400">
                {String(countdown.minutes).padStart(2, '0')}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Minutes
              </div>
            </div>
          </div>
        </div>

        {/* 6-Metric Divided Strip (Single elevation, hairline dividers, zero nested cards) */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-6 gap-x-6">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Current Streak
            </p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
              {streak.currentStreak}d
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
              Longest: {streak.longestStreak}d
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Studied This Week
            </p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
              {hoursThisWeek}h
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
              Goal: {Math.round(settings.dailyGoalHours * 7)}h/wk
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Syllabus Coverage
            </p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
              {syllabusStats.pct}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
              {syllabusStats.masteredCount}/{syllabusStats.totalCount} practised
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              PYQs Solved
            </p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
              {pyqSummary.solved}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
              {pyqSummary.acc !== null ? `${pyqSummary.acc}% accuracy` : 'Log questions'}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Avg Mock Score
            </p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
              {avgMockScore !== null ? avgMockScore.toFixed(1) : '—'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
              Target: {settings.targetScore}/100
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Streak Freezes
            </p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
              {streak.freezesRemainingThisMonth}/2
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Remaining this month
            </p>
          </div>
        </div>
      </section>

      {/* Main Two-Column Split: Today's Plan + Subject Strength Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Today's Plan (7 cols) */}
        <section className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Today&apos;s Plan
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Auto-curated from {activePhase?.title ?? 'schedule'}, due revisions, and PYQ targets
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400 shrink-0">
                {todaysTasks.filter((t) => t.completed).length}/{todaysTasks.length} done
              </span>
            </div>

            {todaysTasks.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No tasks scheduled yet for today. Add a task below to start.
              </div>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {todaysTasks.map((task) => {
                  const subjName = task.subjectId
                    ? SUBJECT_MAP[task.subjectId]?.shortName
                    : null;
                  return (
                    <li
                      key={task.id}
                      className="py-3 flex items-start justify-between gap-3 group"
                    >
                      <label className="flex items-start gap-3 cursor-pointer flex-1 min-w-0">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={task.completed}
                          onClick={() => toggleDailyTask(task.id)}
                          className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                            task.completed
                              ? 'bg-teal-600 border-teal-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 hover:border-teal-500'
                          }`}
                        >
                          {task.completed && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-medium transition-colors ${
                              task.completed
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-800 dark:text-slate-100'
                            }`}
                          >
                            {task.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="capitalize">{task.category}</span>
                            {subjName ? ` · ${subjName}` : ''}
                          </p>
                        </div>
                      </label>

                      <button
                        type="button"
                        onClick={() => deleteDailyTask(task.id)}
                        aria-label={`Remove task ${task.title}`}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-500 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <form
            onSubmit={handleAddTask}
            className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add custom task for today..."
              className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition-opacity flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </form>
        </section>

        {/* Right: Subject-Wise Strength Radar Chart (5 cols) */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Subject Strength Profile
              </h2>
              <button
                type="button"
                onClick={() => setActivePage('pyq')}
                className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <span>PYQ Stats</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Computed from topic PYQ accuracy, mock subject scores, and syllabus stage
            </p>
          </div>

          <div className="h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#334155" strokeOpacity={0.45} />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                />
                <Radar
                  name="Strength %"
                  dataKey="strength"
                  stroke="#14b8a6"
                  fill="#14b8a6"
                  fillOpacity={0.3}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '0.5rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                  formatter={(value: unknown) => [`${value}%`, 'Strength']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Mocks: <strong className="font-mono tabular-nums text-slate-800 dark:text-slate-200">{mockTests.length}</strong> · Days logged: <strong className="font-mono tabular-nums text-slate-800 dark:text-slate-200">{Object.keys(dailyLogs).length}</strong>
            </span>
            {mockTests.length === 0 && Object.keys(dailyLogs).length === 0 && (
              <button
                type="button"
                onClick={loadDemoData}
                className="text-teal-600 dark:text-teal-400 hover:underline font-medium whitespace-nowrap shrink-0"
              >
                Load sample data
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Activity Heatmap & Streak Milestones */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Daily Study Consistency
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Active days require 30+ minutes logged or 1+ completed task · 2 streak freezes available each month
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {streak.canFreezeYesterday && (
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  const yStr = `${d.getFullYear()}-${String(
                    d.getMonth() + 1
                  ).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  handleApplyFreeze(yStr);
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Freeze Missed Yesterday</span>
              </button>
            )}
            {!streak.isTodayActive && streak.freezesRemainingThisMonth > 0 && (
              <button
                type="button"
                onClick={() => handleApplyFreeze(todayStr)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
                <span>Use Freeze Today ({streak.freezesRemainingThisMonth} left)</span>
              </button>
            )}
          </div>
        </div>

        {freezeNotice && (
          <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">
            {freezeNotice}
          </p>
        )}

        <Heatmap activityByDate={streak.activityByDate} weeksCount={28} />

        {/* Milestone Badges Row */}
        <div className="pt-5 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Streak Milestone Badges
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {streak.unlockedBadgeDays.length}/{STREAK_BADGES.length} unlocked
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STREAK_BADGES.map((badge) => {
              const unlocked = streak.unlockedBadgeDays.includes(badge.days);
              return (
                <button
                  key={badge.id}
                  type="button"
                  onClick={() => {
                    if (unlocked) streak.celebrateBadge();
                  }}
                  disabled={!unlocked}
                  className={`text-left p-3.5 rounded-lg border transition-colors ${
                    unlocked
                      ? 'border-teal-500/40 bg-teal-500/5 hover:bg-teal-500/10 cursor-pointer'
                      : 'border-slate-200 dark:border-slate-800 opacity-60 cursor-default'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono tabular-nums font-semibold text-teal-600 dark:text-teal-400">
                      {badge.days} Days
                    </span>
                    <Award
                      className={`w-4 h-4 ${
                        unlocked
                          ? 'text-teal-500'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                    />
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                    {badge.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {unlocked
                      ? `${badge.description} (Click to celebrate)`
                      : badge.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
