import React, { useRef, useState } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  Sun,
  Moon,
  Database,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { getLocalDateString } from '../utils/dateUtils';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportAllJson,
    importAllJson,
    resetAllData,
    loadDemoData,
  } = useAppState();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDemo, setConfirmDemo] = useState(false);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const showStatus = (ok: boolean, message: string) => {
    setFeedback({ ok, message });
    window.setTimeout(() => setFeedback(null), 4500);
  };

  const handleExport = () => {
    const json = exportAllJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gate-track-backup-${getLocalDateString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showStatus(true, 'Exported complete GATE-Track JSON backup.');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      const result = importAllJson(content);
      showStatus(result.ok, result.message);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Settings &amp; Data Portability
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Configure your GATE 2027 DA schedule parameters, interface theme, and local JSON backups.
          </p>
        </div>

        {feedback && (
          <div
            role="status"
            className={`p-3.5 rounded-lg border flex items-center gap-2.5 text-xs font-medium ${
              feedback.ok
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                : 'border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-300'
            }`}
          >
            {feedback.ok ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Exam & Goal Configuration */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="setting-exam-date"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              GATE 2027 DA Exam Date
            </label>
            <input
              id="setting-exam-date"
              type="date"
              value={settings.examDate}
              onChange={(e) =>
                e.target.value && updateSettings({ examDate: e.target.value })
              }
              className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Default: 6 February 2027. Updates live countdown &amp; 5-phase planner.
            </p>
          </div>

          <div>
            <label
              htmlFor="setting-daily-goal"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Daily Study Goal (Hours)
            </label>
            <input
              id="setting-daily-goal"
              type="number"
              step="0.5"
              min={0.5}
              max={16}
              value={settings.dailyGoalHours}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!Number.isNaN(v)) {
                  updateSettings({
                    dailyGoalHours: Math.max(0.5, Math.min(16, v)),
                  });
                }
              }}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Weekly target: {Math.round(settings.dailyGoalHours * 7 * 10) / 10} hours/week.
            </p>
          </div>

          <div>
            <label
              htmlFor="setting-target-score"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Target Mock Score (/100)
            </label>
            <input
              id="setting-target-score"
              type="number"
              min={10}
              max={100}
              value={settings.targetScore}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!Number.isNaN(v)) {
                  updateSettings({
                    targetScore: Math.max(10, Math.min(100, v)),
                  });
                }
              }}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Appearance Theme
            </span>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => updateSettings({ theme: 'dark' })}
                className={`py-1.5 px-3 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                  settings.theme === 'dark'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark Mode</span>
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ theme: 'light' })}
                className={`py-1.5 px-3 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                  settings.theme === 'light'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light Mode</span>
              </button>
            </div>
          </div>
        </div>

        {/* Data Management: Export / Import / Demo / Reset */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Backup, Restore &amp; Reset
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              All state is stored locally via the pluggable StorageAdapter interface (ready for Supabase migration).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExport}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export All Data (JSON)</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON Backup</span>
            </button>

            {!confirmDemo ? (
              <button
                type="button"
                onClick={() => {
                  setConfirmDemo(true);
                  setConfirmReset(false);
                }}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-sky-500/40 text-sky-700 dark:text-sky-300 hover:bg-sky-500/10 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Load Sample Prep Data</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    loadDemoData();
                    setConfirmDemo(false);
                    showStatus(
                      true,
                      'Sample GATE DA preparation history loaded across all modules.'
                    );
                  }}
                  className="px-3.5 py-2 text-xs font-medium rounded-lg bg-sky-600 text-white whitespace-nowrap"
                >
                  Confirm Load Sample
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDemo(false)}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
                Reset Tracker Data
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Clears logs, mocks, PYQs, and streak history back to the clean pre-seeded syllabus.
              </p>
            </div>

            {!confirmReset ? (
              <button
                type="button"
                onClick={() => {
                  setConfirmReset(true);
                  setConfirmDemo(false);
                }}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap self-start sm:self-center"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Data</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetAllData();
                    setConfirmReset(false);
                    showStatus(true, 'All tracker data has been reset to defaults.');
                  }}
                  className="px-3.5 py-2 text-xs font-medium rounded-lg bg-rose-600 hover:bg-rose-500 text-white whitespace-nowrap"
                >
                  Confirm Permanent Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
