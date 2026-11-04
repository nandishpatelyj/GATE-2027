import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  AlertTriangle,
  Trash2,
  Plus,
} from 'lucide-react';
import { useAppState, SUBJECTS } from '../context/AppStateContext';
import { SUBJECT_MAP } from '../data/syllabus';
import { MistakeType, PyqResult, SubjectId } from '../types';
import { formatShortDate, getLocalDateString } from '../utils/dateUtils';

const SOURCES = [
  'GATE DA 2026',
  'GATE DA 2025',
  'GATE DA 2024',
  'GATE Overflow',
  'Test Series',
  'GATE CSE Relevant PYQ',
];

export const PyqTrackerPage: React.FC = () => {
  const {
    topics,
    pyqLogs,
    addPyqLog,
    togglePyqRevisit,
    deletePyqLog,
    topicPyqStatsMap,
    adjustTopicPyqCounts,
    addErrorLog,
  } = useAppState();

  // Form state for logging a question
  const [source, setSource] = useState(SOURCES[0]);
  const [subjectId, setSubjectId] = useState<SubjectId>('prob_stats');
  const subjectTopics = useMemo(
    () => topics.filter((t) => t.subjectId === subjectId),
    [topics, subjectId]
  );
  const [topicId, setTopicId] = useState<string>('ps_01');
  const [questionRef, setQuestionRef] = useState('');
  const [result, setResult] = useState<PyqResult>('correct');
  const [timeTakenMin, setTimeTakenMin] = useState('2');
  const [timeTakenSecPart, setTimeTakenSecPart] = useState('00');
  const [revisit, setRevisit] = useState(false);
  const [alsoAddError, setAlsoAddError] = useState(false);
  const [mistakeType, setMistakeType] = useState<MistakeType>('Concept gap');
  const [whatWentWrong, setWhatWentWrong] = useState('');
  const [correctApproach, setCorrectApproach] = useState('');

  // Filters
  const [filterSubject, setFilterSubject] = useState<'all' | SubjectId>('all');
  const [onlyWeakTopics, setOnlyWeakTopics] = useState(false);
  const [onlyRevisitLogs, setOnlyRevisitLogs] = useState(false);

  const handleSubjectChange = (nextSubj: SubjectId) => {
    setSubjectId(nextSubj);
    const first = topics.find((t) => t.subjectId === nextSubj);
    if (first) setTopicId(first.id);
  };

  const handleLogQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const activeTopic =
      topics.find((t) => t.id === topicId) || subjectTopics[0];
    if (!activeTopic) return;

    const totalSeconds =
      Math.max(0, parseInt(timeTakenMin || '0', 10)) * 60 +
      Math.max(0, Math.min(59, parseInt(timeTakenSecPart || '0', 10)));

    const refLabel =
      questionRef.trim() || `${source} — ${activeTopic.title}`;

    addPyqLog({
      date: getLocalDateString(),
      source,
      subjectId,
      topicId: activeTopic.id,
      questionRef: refLabel,
      result,
      timeTakenSec: totalSeconds,
      revisit,
    });

    if (result === 'wrong' && alsoAddError && whatWentWrong.trim()) {
      addErrorLog({
        subjectId,
        topicId: activeTopic.id,
        questionSummary: refLabel,
        whatWentWrong: whatWentWrong.trim(),
        mistakeType,
        correctApproach:
          correctApproach.trim() || 'Review standard derivation and solve 3 similar PYQs.',
      });
    }

    setQuestionRef('');
    setRevisit(false);
    setWhatWentWrong('');
    setCorrectApproach('');
  };

  // Summary metrics
  const overview = useMemo(() => {
    let attempted = 0;
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    let weakCount = 0;

    topicPyqStatsMap.forEach((st) => {
      attempted += st.attempted;
      correct += st.correct;
      wrong += st.wrong;
      skipped += st.skipped;
      if (st.isWeak) weakCount += 1;
    });

    const graded = correct + wrong;
    const accuracy = graded > 0 ? Math.round((correct / graded) * 100) : null;
    return { attempted, correct, wrong, skipped, accuracy, weakCount };
  }, [topicPyqStatsMap]);

  const filteredTopicRows = useMemo(() => {
    return topics.filter((t) => {
      if (filterSubject !== 'all' && t.subjectId !== filterSubject) return false;
      const stats = topicPyqStatsMap.get(t.id);
      if (onlyWeakTopics && !stats?.isWeak) return false;
      return true;
    });
  }, [topics, filterSubject, onlyWeakTopics, topicPyqStatsMap]);

  const visibleLogs = useMemo(() => {
    return pyqLogs.filter((l) => {
      if (filterSubject !== 'all' && l.subjectId !== filterSubject) return false;
      if (onlyRevisitLogs && !l.revisit) return false;
      return true;
    });
  }, [pyqLogs, filterSubject, onlyRevisitLogs]);

  return (
    <div className="space-y-6">
      {/* Top Overview */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              PYQ &amp; Practice Tracker
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Log individual GATE DA questions or batch tallies. Topics below 60% accuracy are highlighted automatically.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
            <span>Attempted: {overview.attempted}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 dark:text-emerald-400">
              Correct: {overview.correct}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-rose-600 dark:text-rose-400">
              Wrong: {overview.wrong}
            </span>
            <span aria-hidden="true">·</span>
            <span>Skipped: {overview.skipped}</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              Accuracy: {overview.accuracy !== null ? `${overview.accuracy}%` : '—'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-600 dark:text-amber-400">
              Weak topics: {overview.weakCount}
            </span>
          </div>
        </div>
      </section>

      {/* Log a Question Form */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
          Log Practice Question
        </h2>
        <form onSubmit={handleLogQuestion} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                Subject
              </label>
              <select
                value={subjectId}
                onChange={(e) =>
                  handleSubjectChange(e.target.value as SubjectId)
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {SUBJECTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                Syllabus Topic
              </label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {subjectTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
            <div className="lg:col-span-4">
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                Question Label / Concept Note
              </label>
              <input
                type="text"
                value={questionRef}
                onChange={(e) => setQuestionRef(e.target.value)}
                placeholder="e.g., Q.38 Rank-k SVD Frobenius norm"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="lg:col-span-3">
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                Result
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/90">
                {(['correct', 'wrong', 'skipped'] as PyqResult[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setResult(r)}
                    className={`py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap ${
                      result === r
                        ? r === 'correct'
                          ? 'bg-emerald-600 text-white'
                          : r === 'wrong'
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                Time (mm : ss)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={timeTakenMin}
                  onChange={(e) => setTimeTakenMin(e.target.value)}
                  aria-label="Minutes taken"
                  className="w-full px-2.5 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="text-slate-400 font-mono">:</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={timeTakenSecPart}
                  onChange={(e) => setTimeTakenSecPart(e.target.value)}
                  aria-label="Seconds taken"
                  className="w-full px-2.5 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="lg:col-span-3 flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={revisit}
                  onChange={(e) => setRevisit(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span>Mark to revisit</span>
              </label>

              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Question</span>
              </button>
            </div>
          </div>

          {/* Optional inline Error Log capture when result === 'wrong' */}
          {result === 'wrong' && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-rose-600 dark:text-rose-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alsoAddError}
                  onChange={(e) => setAlsoAddError(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <span>Also record in Mistake Notebook (schedules spaced revision)</span>
              </label>

              {alsoAddError && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Mistake Type
                    </label>
                    <select
                      value={mistakeType}
                      onChange={(e) =>
                        setMistakeType(e.target.value as MistakeType)
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                    >
                      {[
                        'Concept gap',
                        'Calculation',
                        'Silly',
                        'Time pressure',
                        'Misread',
                      ].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                      What went wrong?
                    </label>
                    <input
                      type="text"
                      value={whatWentWrong}
                      onChange={(e) => setWhatWentWrong(e.target.value)}
                      placeholder="Root cause of mistake..."
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Correct Approach
                    </label>
                    <input
                      type="text"
                      value={correctApproach}
                      onChange={(e) => setCorrectApproach(e.target.value)}
                      placeholder="Key formula or check..."
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </section>

      {/* Filter Bar & Topic-Level Accuracy Table */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Topic-Wise PYQ Accuracy
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Topics under 60% accuracy are flagged as Weak for targeted revision
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterSubject}
              onChange={(e) =>
                setFilterSubject(e.target.value as 'all' | SubjectId)
              }
              aria-label="Filter PYQ table by subject"
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            >
              <option value="all">All 8 Subjects</option>
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shortName}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setOnlyWeakTopics((v) => !v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                onlyWeakTopics
                  ? 'border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Weak Topics (&lt;60%) ({overview.weakCount})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 dark:bg-[#0F1522] border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-2.5 px-4 font-medium">Topic</th>
                <th className="py-2.5 px-3 font-medium text-right">Attempted</th>
                <th className="py-2.5 px-3 font-medium text-right">Correct</th>
                <th className="py-2.5 px-3 font-medium text-right">Wrong</th>
                <th className="py-2.5 px-3 font-medium text-right">Skipped</th>
                <th className="py-2.5 px-3 font-medium text-right">Accuracy</th>
                <th className="py-2.5 px-4 font-medium text-right">Quick Tally</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-sm">
              {filteredTopicRows.map((topic) => {
                const st = topicPyqStatsMap.get(topic.id)!;
                return (
                  <tr
                    key={topic.id}
                    className={`transition-colors ${
                      st.isWeak
                        ? 'bg-amber-500/[0.06] hover:bg-amber-500/10'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        {st.isWeak && (
                          <AlertTriangle
                            className="w-3.5 h-3.5 text-amber-500 shrink-0"
                            aria-label="Weak topic below 60% accuracy"
                          />
                        )}
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {topic.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {SUBJECT_MAP[topic.subjectId].shortName}
                            {st.isWeak ? ' · Weak (<60%)' : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {st.attempted}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                      {st.correct}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-rose-600 dark:text-rose-400">
                      {st.wrong}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-500">
                      {st.skipped}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">
                      {st.accuracyPct !== null ? (
                        <span
                          className={
                            st.isWeak
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-teal-600 dark:text-teal-400'
                          }
                        >
                          {st.accuracyPct}%
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            adjustTopicPyqCounts(topic.id, { correct: 1 })
                          }
                          title="Add 1 correct PYQ"
                          className="px-2 py-0.5 text-xs font-mono rounded border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                        >
                          +C
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            adjustTopicPyqCounts(topic.id, { wrong: 1 })
                          }
                          title="Add 1 wrong PYQ"
                          className="px-2 py-0.5 text-xs font-mono rounded border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                        >
                          +W
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            adjustTopicPyqCounts(topic.id, { skipped: 1 })
                          }
                          title="Add 1 skipped PYQ"
                          className="px-2 py-0.5 text-xs font-mono rounded border border-slate-300 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          +S
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTopicRows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    {onlyWeakTopics
                      ? 'No weak topics (<60% accuracy) found for this filter.'
                      : 'No topics match this filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Logged Question History */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Logged Questions ({visibleLogs.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Detailed log with time taken and revisit flags
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOnlyRevisitLogs((v) => !v)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              onlyRevisitLogs
                ? 'border-teal-500/50 bg-teal-500/15 text-teal-700 dark:text-teal-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Revisit List</span>
          </button>
        </div>

        {visibleLogs.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No individual questions logged yet under this filter. Use the form above to record PYQ attempts.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {visibleLogs.map((log) => {
              const mins = Math.floor(log.timeTakenSec / 60);
              const secs = String(log.timeTakenSec % 60).padStart(2, '0');
              return (
                <div
                  key={log.id}
                  className="px-5 py-3.5 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {log.questionRef}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{log.source}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{SUBJECT_MAP[log.subjectId].shortName}</span>
                      <span aria-hidden="true"> · </span>
                      <span
                        className={
                          log.result === 'correct'
                            ? 'text-emerald-600 dark:text-emerald-400 font-medium capitalize'
                            : log.result === 'wrong'
                            ? 'text-rose-600 dark:text-rose-400 font-medium capitalize'
                            : 'capitalize'
                        }
                      >
                        {log.result}
                      </span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono tabular-nums">
                        {mins}:{secs}
                      </span>
                      <span aria-hidden="true"> · </span>
                      <span>{formatShortDate(log.date)}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => togglePyqRevisit(log.id)}
                      aria-label="Toggle revisit bookmark"
                      className={`p-1.5 rounded-lg transition-colors ${
                        log.revisit
                          ? 'text-teal-600 dark:text-teal-400 bg-teal-500/10'
                          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePyqLog(log.id)}
                      aria-label="Delete question log"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
