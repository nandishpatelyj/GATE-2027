import React, { useMemo, useState } from 'react';
import { ExternalLink, Plus, Trash2, Search } from 'lucide-react';
import { SUBJECTS, useAppState } from '../context/AppStateContext';
import { SUBJECT_MAP } from '../data/syllabus';
import { ResourceCategory, SubjectId } from '../types';

const CATEGORIES: ResourceCategory[] = ['Video', 'Notes', 'PDF', 'Official'];

export const ResourcesPage: React.FC = () => {
  const { resources, addResource, deleteResource } = useAppState();

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [subjectId, setSubjectId] = useState<SubjectId | 'all'>('linear_algebra');
  const [category, setCategory] = useState<ResourceCategory>('Video');
  const [authorOrSource, setAuthorOrSource] = useState('');

  // Filters
  const [filterSubject, setFilterSubject] = useState<'all_filter' | 'all' | SubjectId>('all_filter');
  const [filterCategory, setFilterCategory] = useState<'all' | ResourceCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    const normalizedUrl = /^https?:\/\//i.test(url.trim())
      ? url.trim()
      : `https://${url.trim()}`;

    addResource({
      title: title.trim(),
      url: normalizedUrl,
      subjectId,
      category,
      authorOrSource: authorOrSource.trim() || 'Self-curated reference',
    });

    setTitle('');
    setUrl('');
    setAuthorOrSource('');
  };

  const filteredResources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return resources.filter((r) => {
      if (filterSubject !== 'all_filter' && r.subjectId !== filterSubject) {
        return false;
      }
      if (filterCategory !== 'all' && r.category !== filterCategory) {
        return false;
      }
      if (
        q &&
        !r.title.toLowerCase().includes(q) &&
        !r.authorOrSource.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [resources, filterSubject, filterCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Add Resource Card */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Study Resources Library
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 mb-5">
          Organize standard courses, lecture playlists, handwritten notes, and official GATE DA references by subject.
        </p>

        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          <div className="lg:col-span-3">
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
              Resource Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., StatQuest PCA Lecture"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
          </div>

          <div className="lg:col-span-3">
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
              URL
            </label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
              Subject
            </label>
            <select
              value={subjectId}
              onChange={(e) =>
                setSubjectId(e.target.value as SubjectId | 'all')
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            >
              <option value="all">General / All Subjects</option>
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shortName}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
              Type
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ResourceCategory)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2 flex gap-2">
            <input
              type="text"
              value={authorOrSource}
              onChange={(e) => setAuthorOrSource(e.target.value)}
              placeholder="Source (optional)"
              aria-label="Author or Source"
              className="w-full min-w-0 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
            <button
              type="submit"
              aria-label="Add Resource"
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </form>
      </section>

      {/* Filter & Resource Directory */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses, instructors, or notes..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterSubject}
              onChange={(e) =>
                setFilterSubject(
                  e.target.value as 'all_filter' | 'all' | SubjectId
                )
              }
              aria-label="Filter resources by subject"
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            >
              <option value="all_filter">All Subjects</option>
              <option value="all">General / Official</option>
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shortName}
                </option>
              ))}
            </select>

            <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setFilterCategory('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filterCategory === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                All
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFilterCategory(c)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    filterCategory === c
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredResources.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No resources match the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredResources.map((res) => {
              const subjLabel =
                res.subjectId === 'all'
                  ? 'General / Official'
                  : SUBJECT_MAP[res.subjectId].name;
              return (
                <div
                  key={res.id}
                  className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="min-w-0">
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400 inline-flex items-center gap-1.5"
                    >
                      <span className="truncate">{res.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 text-teal-500" />
                    </a>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{subjLabel}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{res.category}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{res.authorOrSource}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteResource(res.id)}
                    aria-label={`Remove ${res.title}`}
                    className="p-1.5 rounded text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
