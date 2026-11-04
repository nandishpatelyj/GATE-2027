import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Plus, Trash2, Search } from 'lucide-react';
import { SUBJECTS, useAppState } from '../context/AppStateContext';
import { SUBJECT_MAP } from '../data/syllabus';
import { SPACED_REVISION_INTERVALS } from '../data/badges';
import { MistakeType, SubjectId } from '../types';
import { formatCompactDate, formatShortDate } from '../utils/dateUtils';

const MISTAKE_TYPES: MistakeType[] = [
  'Concept gap',
  'Calculation',
  'Silly',
  'Time pressure',
  'Misread',
];

export const ErrorLogPage: React.FC = () => {
  const { topics, errorLogs, addErrorLog, deleteErrorLog } = useAppState();

  const [subjectId, setSubjectId] = useState<SubjectId>('prob_stats');
  const subjectTopics = useMemo(
    () => topics.filter((t) => t.subjectId === subjectId),
    [topics, subjectId]
  );
  const [topicId, setTopicId] = useState('ps_01');
  const [questionSummary, setQuestionSummary] = useState('');
  const [mistakeType, setMistakeType] = useState<MistakeType>('Concept gap');
  const [whatWentWrong, setWhatWentWrong] = useState('');
  const [correctApproach, setCorrectApproach] = useState('');

  // Filters
  const [filterSubject, setFilterSubject] = useState<'all' | SubjectId>('all');
  const [filterMistake, setFilterMistake] = useState<'all' | MistakeType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubjectChange = (nextSubj: SubjectId) => {
    setSubjectId(nextSubj);
    const first = topics.find((t) => t.subjectId === nextSubj);
    if (first) setTopicId(first.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionSummary.trim() || !whatWentWrong.trim()) return;
    const activeTopic =
      topics.find((t) => t.id === topicId) || subjectTopics[0];
    if (!activeTopic) return;

    addErrorLog({
      subjectId,
      topicId: activeTopic.id,
      questionSummary: questionSummary.trim(),
      whatWentWrong: whatWentWrong.trim(),
      mistakeType,
      correctApproach:
        correctApproach.trim() || 'Re-derive from fundamentals and verify edge conditions.',
    });

    setQuestionSummary('');
    setWhatWentWrong('');
    setCorrectApproach('');
  };

  const mistakeChartData = useMemo(() => {
    return MISTAKE_TYPES.map((mType) => ({
      type: mType,
      count: errorLogs.filter((e) => e.mistakeType === mType).length,
    }));
  }, [errorLogs]);

  const filteredErrors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return errorLogs.filter((err) => {
      if (filterSubject !== 'all' && err.subjectId !== filterSubject)
        return false;
      if (filterMistake !== 'all' && err.mistakeType !== filterMistake)
        return false;
      if (
        q &&
        !err.questionSummary.toLowerCase().includes(q) &&
        !err.whatWentWrong.toLowerCase().includes(q) &&
        !err.correctApproach.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [errorLogs, filterSubject, filterMistake, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Split: Add Mistake Form + Mistake Type Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Error Log (Mistake Notebook)
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 mb-5">
            Every logged mistake automatically enters the 1, 3, 7, 21, and 45-day Revision Queue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Subject
                </label>
                <select
                  value={subjectId}
                  onChange={(e) =>
                    handleSubjectChange(e.target.value as SubjectId)
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.shortName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Topic
                </label>
                <select
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  {subjectTopics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Mistake Type
                </label>
                <select
                  value={mistakeType}
                  onChange={(e) =>
                    setMistakeType(e.target.value as MistakeType)
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  {MISTAKE_TYPES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                Question / Concept Summary
              </label>
              <input
                type="text"
                required
                value={questionSummary}
                onChange={(e) => setQuestionSummary(e.target.value)}
                placeholder="e.g., GATE DA 2025 Q.44 — Singular values vs eigenvalues of A^T A"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  What Went Wrong
                </label>
                <textarea
                  rows={2}
                  required
                  value={whatWentWrong}
                  onChange={(e) => setWhatWentWrong(e.target.value)}
                  placeholder="Describe the exact trap, misread constraint, or missing theorem..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Correct Approach / Takeaway
                </label>
                <textarea
                  rows={2}
                  value={correctApproach}
                  onChange={(e) => setCorrectApproach(e.target.value)}
                  placeholder="Step-by-step fix or sanity check to apply next time..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Mistake Notebook</span>
              </button>
            </div>
          </form>
        </section>

        {/* Mistake Type Frequency Chart */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Mistake Pattern Breakdown
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Distribution of logged errors by root-cause category
            </p>
          </div>

          {errorLogs.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400 text-center">
              Log your first error from mocks or PYQs to analyze recurring mistake patterns.
            </div>
          ) : (
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mistakeChartData} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                    strokeOpacity={0.3}
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="type"
                    width={96}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '0.5rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Mistakes"
                    fill="#f59e0b"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Total entries:{' '}
              <strong className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {errorLogs.length}
              </strong>
            </span>
            <span>Spaced cadence: 1 · 3 · 7 · 21 · 45d</span>
          </div>
        </section>
      </div>

      {/* Filterable Error Notebook Entries */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logged mistakes..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterSubject}
              onChange={(e) =>
                setFilterSubject(e.target.value as 'all' | SubjectId)
              }
              aria-label="Filter errors by subject"
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            >
              <option value="all">All Subjects</option>
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shortName}
                </option>
              ))}
            </select>

            <select
              value={filterMistake}
              onChange={(e) =>
                setFilterMistake(e.target.value as 'all' | MistakeType)
              }
              aria-label="Filter errors by mistake type"
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            >
              <option value="all">All Mistake Types</option>
              {MISTAKE_TYPES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredErrors.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
            No error notebook entries match this filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredErrors.map((err) => {
              const topicTitle =
                topics.find((t) => t.id === err.topicId)?.title ?? 'General';
              const intervalLabel =
                SPACED_REVISION_INTERVALS[err.revisionStage] ?? 'Graduated';
              return (
                <div key={err.id} className="p-5 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {err.questionSummary}
                      </h3>
                      {/* Clean unboxed inline metadata */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          {err.mistakeType}
                        </span>
                        <span aria-hidden="true"> · </span>
                        <span>{SUBJECT_MAP[err.subjectId].shortName}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{topicTitle}</span>
                        <span aria-hidden="true"> · </span>
                        <span className="font-mono tabular-nums">
                          {err.resolved
                            ? 'Completed 5 cycles'
                            : `Next review ${formatCompactDate(
                                err.nextRevisionDate
                              )} (${intervalLabel}d step)`}
                        </span>
                        <span aria-hidden="true"> · </span>
                        <span>Logged {formatShortDate(err.createdAt)}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteErrorLog(err.id)}
                      aria-label="Delete error entry"
                      className="p-1.5 rounded text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
                    <div>
                      <span className="font-medium text-rose-600 dark:text-rose-400">
                        What went wrong:{' '}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {err.whatWentWrong}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        Correct approach:{' '}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {err.correctApproach}
                      </span>
                    </div>
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
