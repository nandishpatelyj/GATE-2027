import React, { useMemo, useState } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';
import { useAppState, SUBJECTS } from '../context/AppStateContext';
import { ImportanceLevel, SubjectId, TopicStatus } from '../types';
import { formatCompactDate } from '../utils/dateUtils';

const STATUS_OPTIONS: { value: TopicStatus; label: string }[] = [
  { value: 'not_started', label: 'Not started' },
  { value: 'learning', label: 'Learning' },
  { value: 'practised', label: 'Practised' },
  { value: 'revised', label: 'Revised' },
];

const IMPORTANCE_OPTIONS: ImportanceLevel[] = ['High', 'Medium', 'Low'];

export const SyllabusPage: React.FC = () => {
  const { topics, updateTopicStatus, updateTopicDetails } = useAppState();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TopicStatus>('all');
  const [importanceFilter, setImportanceFilter] = useState<
    'all' | ImportanceLevel
  >('all');
  const [collapsedSubjects, setCollapsedSubjects] = useState<
    Record<string, boolean>
  >({});
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);

  const toggleSubjectCollapse = (subjectId: SubjectId) => {
    setCollapsedSubjects((prev) => ({
      ...prev,
      [subjectId]: !prev[subjectId],
    }));
  };

  const filteredTopics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return topics.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (importanceFilter !== 'all' && t.importance !== importanceFilter)
        return false;
      if (q && !t.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [topics, searchQuery, statusFilter, importanceFilter]);

  const countsByStatus = useMemo(() => {
    const map: Record<TopicStatus, number> = {
      not_started: 0,
      learning: 0,
      practised: 0,
      revised: 0,
    };
    topics.forEach((t) => {
      map[t.status] += 1;
    });
    return map;
  }, [topics]);

  return (
    <div className="space-y-6">
      {/* Header & Overall Mastery Summary */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              GATE DA Syllabus Tracker
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              8 official sections · {topics.length} granular topics · Marking a topic{' '}
              <strong className="font-medium text-slate-900 dark:text-slate-200">
                Practised
              </strong>{' '}
              automatically schedules 1, 3, 7, 21, and 45-day spaced revisions.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400 shrink-0">
            <span>Not started: {countsByStatus.not_started}</span>
            <span aria-hidden="true">·</span>
            <span>Learning: {countsByStatus.learning}</span>
            <span aria-hidden="true">·</span>
            <span className="text-teal-600 dark:text-teal-400">
              Practised: {countsByStatus.practised}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 dark:text-emerald-400">
              Revised: {countsByStatus.revised}
            </span>
          </div>
        </div>

        {/* Search & Interactive Segmented Filter Controls */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter topics (e.g., SVD, Bayes, A* search, BCNF)..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter Segmented Bar */}
            <div
              role="group"
              aria-label="Filter by status"
              className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/90 overflow-x-auto"
            >
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Status
              </button>
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    statusFilter === opt.value
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Importance Filter Segmented Bar */}
            <div
              role="group"
              aria-label="Filter by importance"
              className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/90"
            >
              <button
                type="button"
                onClick={() => setImportanceFilter('all')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  importanceFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Priority
              </button>
              {IMPORTANCE_OPTIONS.map((imp) => (
                <button
                  key={imp}
                  type="button"
                  onClick={() => setImportanceFilter(imp)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    importanceFilter === imp
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {imp}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Subject Sections */}
      <div className="space-y-4">
        {SUBJECTS.map((subject) => {
          const allSubjTopics = topics.filter((t) => t.subjectId === subject.id);
          const visibleSubjTopics = filteredTopics.filter(
            (t) => t.subjectId === subject.id
          );

          if (visibleSubjTopics.length === 0) return null;

          const weightedDone = allSubjTopics.reduce((sum, t) => {
            if (t.status === 'revised') return sum + 1;
            if (t.status === 'practised') return sum + 0.85;
            if (t.status === 'learning') return sum + 0.35;
            return sum;
          }, 0);
          const progressPct =
            allSubjTopics.length > 0
              ? Math.round((weightedDone / allSubjTopics.length) * 100)
              : 0;
          const masteredCount = allSubjTopics.filter(
            (t) => t.status === 'practised' || t.status === 'revised'
          ).length;

          const isCollapsed = Boolean(collapsedSubjects[subject.id]);

          return (
            <section
              key={subject.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden"
            >
              {/* Subject Header & Progress Bar */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800/90">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggleSubjectCollapse(subject.id)}
                    className="flex items-center gap-2.5 text-left group focus-visible:outline-none"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 shrink-0" />
                    )}
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                        {subject.name}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                        {masteredCount}/{allSubjTopics.length} practised or revised · ~
                        {subject.expectedMarks} marks weightage
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-3 sm:w-56 shrink-0">
                    <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-teal-500 transition-all duration-200"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300 w-10 text-right">
                      {progressPct}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Topic Rows */}
              {!isCollapsed && (
                <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
                  {visibleSubjTopics.map((topic) => {
                    const isEditing = editingTopicId === topic.id;
                    return (
                      <div key={topic.id} className="px-5 py-3.5">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {topic.title}
                            </p>
                            {/* Clean unboxed inline metadata */}
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                              <span
                                className={
                                  topic.importance === 'High'
                                    ? 'text-amber-600 dark:text-amber-400 font-medium'
                                    : ''
                                }
                              >
                                {topic.importance} priority
                              </span>
                              {topic.nextRevisionDate && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono tabular-nums">
                                    Next review {formatCompactDate(topic.nextRevisionDate)}
                                  </span>
                                </>
                              )}
                              {topic.videoUrl && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <a
                                    href={topic.videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
                                  >
                                    <span>Video</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </>
                              )}
                              {topic.notesUrl && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <a
                                    href={topic.notesUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
                                  >
                                    <span>Notes</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </>
                              )}
                            </div>
                          </div>

                          {/* 4-Step Status Selector + Links/Importance Editor Button */}
                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <div
                              role="group"
                              aria-label={`Status for ${topic.title}`}
                              className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/90"
                            >
                              {STATUS_OPTIONS.map((st) => {
                                const active = topic.status === st.value;
                                return (
                                  <button
                                    key={st.value}
                                    type="button"
                                    onClick={() =>
                                      updateTopicStatus(topic.id, st.value)
                                    }
                                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                                      active
                                        ? st.value === 'revised'
                                          ? 'bg-emerald-600 text-white'
                                          : st.value === 'practised'
                                          ? 'bg-teal-600 text-white'
                                          : st.value === 'learning'
                                          ? 'bg-sky-600 text-white'
                                          : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                                  >
                                    {st.label}
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setEditingTopicId(isEditing ? null : topic.id)
                              }
                              aria-expanded={isEditing}
                              aria-label={`Edit links and priority for ${topic.title}`}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                isEditing
                                  ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-teal-500/10'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                              }`}
                            >
                              <SlidersHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Inline Editable Fields: Video Link, Notes Link, Importance */}
                        {isEditing && (
                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/70 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                                Importance
                              </label>
                              <select
                                value={topic.importance}
                                onChange={(e) =>
                                  updateTopicDetails(topic.id, {
                                    importance: e.target
                                      .value as ImportanceLevel,
                                  })
                                }
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                              >
                                {IMPORTANCE_OPTIONS.map((imp) => (
                                  <option key={imp} value={imp}>
                                    {imp}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                                Lecture / Video URL
                              </label>
                              <input
                                type="url"
                                value={topic.videoUrl}
                                onChange={(e) =>
                                  updateTopicDetails(topic.id, {
                                    videoUrl: e.target.value,
                                  })
                                }
                                placeholder="https://youtube.com/..."
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                                Notes / Summary URL
                              </label>
                              <input
                                type="url"
                                value={topic.notesUrl}
                                onChange={(e) =>
                                  updateTopicDetails(topic.id, {
                                    notesUrl: e.target.value,
                                  })
                                }
                                placeholder="https://notion.so/... or Drive link"
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

        {filteredTopics.length === 0 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-10 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No syllabus topics match the current search or filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setImportanceFilter('all');
              }}
              className="mt-3 px-4 py-2 text-xs font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-500 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
