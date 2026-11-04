import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { Plus, Trash2 } from 'lucide-react';
import {
  createEmptySubjectHours,
  SUBJECTS,
  useAppState,
} from '../context/AppStateContext';
import { SubjectId } from '../types';
import { formatCompactDate, formatShortDate, getLocalDateString } from '../utils/dateUtils';

export const MockTestsPage: React.FC = () => {
  const { mockTests, addMockTest, deleteMockTest, settings, updateSettings } =
    useAppState();

  const [showForm, setShowForm] = useState(mockTests.length === 0);
  const [name, setName] = useState('');
  const [date, setDate] = useState(() => getLocalDateString());
  const [marks, setMarks] = useState('');
  const [rank, setRank] = useState('');
  const [timeSpentMin, setTimeSpentMin] = useState('180');
  const [subjectMarks, setSubjectMarks] = useState<Record<SubjectId, number>>(
    () => createEmptySubjectHours()
  );

  const handleSubjectMarkChange = (subjId: SubjectId, val: string) => {
    const parsed = parseFloat(val);
    const nextVal = Number.isNaN(parsed) ? 0 : parsed;
    setSubjectMarks((prev) => {
      const updated = { ...prev, [subjId]: nextVal };
      const autoSum =
        Math.round(
          Object.values(updated).reduce((a, b) => a + b, 0) * 100
        ) / 100;
      setMarks(String(autoSum));
      return updated;
    });
  };

  const handleAddMock = (e: React.FormEvent) => {
    e.preventDefault();
    const numericMarks = parseFloat(marks);
    if (!name.trim() || Number.isNaN(numericMarks)) return;

    const parsedRank = rank.trim() ? parseInt(rank, 10) : undefined;
    const parsedTime = Math.max(1, parseInt(timeSpentMin || '180', 10));

    addMockTest({
      name: name.trim(),
      date,
      marks: Math.round(numericMarks * 100) / 100,
      maxMarks: 100,
      rank: parsedRank && !Number.isNaN(parsedRank) ? parsedRank : undefined,
      timeSpentMin: parsedTime,
      subjectMarks,
    });

    setName('');
    setMarks('');
    setRank('');
    setTimeSpentMin('180');
    setSubjectMarks(createEmptySubjectHours());
    setShowForm(false);
  };

  // Computed analytics
  const stats = useMemo(() => {
    if (mockTests.length === 0) {
      return { avg: 0, best: 0, latest: 0 };
    }
    const avg =
      mockTests.reduce((s, m) => s + m.marks, 0) / mockTests.length;
    const best = Math.max(...mockTests.map((m) => m.marks));
    const latest = mockTests[mockTests.length - 1].marks;
    return {
      avg: Math.round(avg * 10) / 10,
      best: Math.round(best * 10) / 10,
      latest: Math.round(latest * 10) / 10,
    };
  }, [mockTests]);

  const trendData = useMemo(
    () =>
      mockTests.map((m, idx) => ({
        index: idx + 1,
        label: formatCompactDate(m.date),
        name: m.name,
        marks: m.marks,
      })),
    [mockTests]
  );

  const subjectAvgData = useMemo(() => {
    return SUBJECTS.map((subj) => {
      const avg =
        mockTests.length > 0
          ? Math.round(
              (mockTests.reduce(
                (s, m) => s + (m.subjectMarks?.[subj.id] ?? 0),
                0
              ) /
                mockTests.length) *
                100
            ) / 100
          : 0;
      return {
        subject: subj.shortName,
        average: avg,
        expectedMax: subj.expectedMarks,
      };
    });
  }, [mockTests]);

  // SVG Semicircular Target Score Gauge calculation
  const target = Math.max(1, Math.min(100, settings.targetScore || 60));
  const currentScoreForGauge = mockTests.length > 0 ? stats.latest : 0;
  const gaugeProgress = Math.max(0, Math.min(1, currentScoreForGauge / 100));
  const targetProgress = Math.max(0, Math.min(1, target / 100));
  const arcRadius = 74;
  const arcCircumference = Math.PI * arcRadius; // half circle length
  const strokeOffset = arcCircumference * (1 - gaugeProgress);
  // Target marker coordinates along semicircle centered at (90, 88)
  const targetAngle = Math.PI * (1 - targetProgress);
  const markerX = 90 + arcRadius * Math.cos(targetAngle);
  const markerY = 88 - arcRadius * Math.sin(targetAngle);

  return (
    <div className="space-y-6">
      {/* Header + Target Score Gauge */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Mock Test Analytics
              </h1>
              <button
                type="button"
                onClick={() => setShowForm((v) => !v)}
                className="px-3.5 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showForm ? 'Close Form' : 'Log Mock Test'}</span>
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Track full-length 100-mark GATE DA mocks, monitor score trajectory against your target score, and isolate low-yield sections.
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
              <div>
                <span>Mocks Logged</span>
                <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                  {mockTests.length}
                </p>
              </div>
              <div>
                <span>Latest Score</span>
                <p className="text-xl font-bold font-mono tabular-nums text-teal-600 dark:text-teal-400 mt-0.5">
                  {mockTests.length > 0 ? `${stats.latest}/100` : '—'}
                </p>
              </div>
              <div>
                <span>Average Score</span>
                <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                  {mockTests.length > 0 ? `${stats.avg}/100` : '—'}
                </p>
              </div>
              <div>
                <span>Best Score</span>
                <p className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {mockTests.length > 0 ? `${stats.best}/100` : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Target Score Gauge */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-between gap-4 pt-4 lg:pt-0 lg:pl-6 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800">
            <div className="flex flex-col items-center">
              <svg
                width="180"
                height="104"
                viewBox="0 0 180 104"
                aria-label={`Latest mock score ${currentScoreForGauge} out of 100, target ${target}`}
              >
                {/* Track */}
                <path
                  d="M 16 88 A 74 74 0 0 1 164 88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeLinecap="round"
                  className="text-slate-200 dark:text-slate-800"
                />
                {/* Value Arc */}
                <path
                  d="M 16 88 A 74 74 0 0 1 164 88"
                  fill="none"
                  stroke="#14b8a6"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={arcCircumference}
                  strokeDashoffset={strokeOffset}
                />
                {/* Target Score Marker Dot */}
                <circle
                  cx={markerX}
                  cy={markerY}
                  r="5"
                  fill="#f59e0b"
                  stroke="#0f172a"
                  strokeWidth="2"
                />
                <text
                  x="90"
                  y="74"
                  textAnchor="middle"
                  className="fill-slate-900 dark:fill-white font-mono text-xl font-bold"
                >
                  {mockTests.length > 0 ? stats.latest : '0'}
                </text>
                <text
                  x="90"
                  y="92"
                  textAnchor="middle"
                  className="fill-slate-500 dark:fill-slate-400 text-[11px]"
                >
                  vs {target} target
                </text>
              </svg>
            </div>

            <div className="space-y-1.5 text-center sm:text-left">
              <label
                htmlFor="target-score-input"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                Target GATE Score (/100)
              </label>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <input
                  id="target-score-input"
                  type="number"
                  min={10}
                  max={100}
                  value={settings.targetScore}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!Number.isNaN(v)) {
                      updateSettings({
                        targetScore: Math.min(100, Math.max(1, v)),
                      });
                    }
                  }}
                  className="w-24 px-3 py-1.5 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  Amber marker
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mockTests.length === 0
                  ? 'Log a mock to compare against target'
                  : stats.latest >= target
                  ? `+${(stats.latest - target).toFixed(1)} marks above target`
                  : `${(target - stats.latest).toFixed(1)} marks to reach target`}
              </p>
            </div>
          </div>
        </div>

        {/* Log Mock Form */}
        {showForm && (
          <form
            onSubmit={handleAddMock}
            className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4"
          >
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Record Full-Length Mock Test
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Mock Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., AIMT Full Syllabus Mock #5"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Total Marks (/100)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={-33}
                  max={100}
                  required
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  placeholder="62.33"
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Rank (opt)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                    placeholder="180"
                    className="w-full px-2.5 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Time (min)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={timeSpentMin}
                    onChange={(e) => setTimeSpentMin(e.target.value)}
                    className="w-full px-2.5 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Subject-wise Marks Breakdown (entering values automatically sums Total Marks above)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {SUBJECTS.map((subj) => (
                  <div key={subj.id}>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 truncate mb-1">
                      {subj.shortName}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={subjectMarks[subj.id] || ''}
                      onChange={(e) =>
                        handleSubjectMarkChange(subj.id, e.target.value)
                      }
                      placeholder={`/${subj.expectedMarks}`}
                      className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors"
              >
                Save Mock Result
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart: Score Trend */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Score Trajectory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">
            Marks out of 100 across chronological mocks vs {target}-mark target line
          </p>

          {trendData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No mock tests logged yet.
              </p>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-3 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-teal-600 text-white"
              >
                Log First Mock
              </button>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                    strokeOpacity={0.3}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <YAxis
                    domain={[0, 100]}
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
                  <ReferenceLine
                    y={target}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{
                      value: `Target ${target}`,
                      fill: '#f59e0b',
                      fontSize: 11,
                      position: 'insideTopRight',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="marks"
                    name="Score"
                    stroke="#14b8a6"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#14b8a6' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Bar Chart: Subject-Wise Average */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Subject-Wise Average Marks
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">
            Average marks earned per section across all logged mocks
          </p>

          {mockTests.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
              Subject averages appear once at least one mock is recorded.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectAvgData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                    strokeOpacity={0.3}
                  />
                  <XAxis
                    dataKey="subject"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={48}
                  />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
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
                    dataKey="average"
                    name="Avg Marks"
                    fill="#0ea5e9"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      {/* All Mocks Table */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            All Logged Mock Tests
          </h2>
        </div>

        {mockTests.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No mock test entries yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-[#0F1522] border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Mock Name</th>
                  <th className="py-2.5 px-3 font-medium">Date</th>
                  <th className="py-2.5 px-3 font-medium text-right">Marks</th>
                  <th className="py-2.5 px-3 font-medium text-right">Rank</th>
                  <th className="py-2.5 px-3 font-medium text-right">Time</th>
                  <th className="py-2.5 px-4 font-medium">Section Highlights</th>
                  <th className="py-2.5 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {[...mockTests].reverse().map((mock) => (
                  <tr
                    key={mock.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                      {mock.name}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatShortDate(mock.date)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-teal-600 dark:text-teal-400">
                      {mock.marks.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {mock.rank ? `#${mock.rank}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {mock.timeSpentMin}m
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
                      {SUBJECTS.filter((s) => (mock.subjectMarks?.[s.id] ?? 0) > 0)
                        .slice(0, 4)
                        .map(
                          (s) => `${s.shortName}: ${mock.subjectMarks[s.id]}`
                        )
                        .join(' · ') || 'Total score logged'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => deleteMockTest(mock.id)}
                        aria-label={`Delete ${mock.name}`}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
