import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  LineChart,
  AlertTriangle,
  RotateCcw,
  CalendarRange,
  NotebookPen,
  Timer,
  Library,
  Settings,
  Menu,
  X,
  Flame,
  Play,
  Pause,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppPage } from '../types';
import { useAppState } from '../context/AppStateContext';

interface NavItemConfig {
  id: AppPage;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { id: 'syllabus', label: 'Syllabus Tracker', shortLabel: 'Syllabus', icon: BookOpen },
  { id: 'pyq', label: 'PYQ & Practice', shortLabel: 'PYQs', icon: FileQuestion },
  { id: 'mocks', label: 'Mock Tests', shortLabel: 'Mocks', icon: LineChart },
  { id: 'errors', label: 'Error Log', shortLabel: 'Errors', icon: AlertTriangle },
  { id: 'revision', label: 'Revision Queue', shortLabel: 'Revise', icon: RotateCcw },
  { id: 'planner', label: 'Study Planner', shortLabel: 'Planner', icon: CalendarRange },
  { id: 'daily_log', label: 'Daily Log', shortLabel: 'Log', icon: NotebookPen },
  { id: 'pomodoro', label: 'Pomodoro Timer', shortLabel: 'Focus', icon: Timer },
  { id: 'resources', label: 'Resources', shortLabel: 'Links', icon: Library },
  { id: 'settings', label: 'Settings', shortLabel: 'Settings', icon: Settings },
];

const MOBILE_PRIMARY_TABS: NavItemConfig[] = [
  NAV_ITEMS[0], // Dashboard
  NAV_ITEMS[1], // Syllabus
  NAV_ITEMS[2], // PYQ
  NAV_ITEMS[5], // Revision
];

function formatTimerClock(sec: number): string {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    activePage,
    setActivePage,
    streak,
    revisionQueue,
    pomodoro,
    countdown,
  } = useAppState();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const currentNav =
    NAV_ITEMS.find((n) => n.id === activePage) || NAV_ITEMS[0];
  const dueCount = revisionQueue.dueTodayItems.length;

  const handleSelectPage = (page: AppPage) => {
    setActivePage(page);
    setMobileDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0F1522] z-30">
        <div className="h-14 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/90">
          <button
            type="button"
            onClick={() => handleSelectPage('dashboard')}
            className="text-base font-bold tracking-tight text-slate-900 dark:text-white font-display whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded"
          >
            GATE-Track
          </button>
          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {countdown.days}d left
          </span>
        </div>

        <nav
          aria-label="Sidebar Navigation"
          className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectPage(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.id === 'revision' && dueCount > 0 && (
                  <span className="text-xs font-mono tabular-nums text-teal-600 dark:text-teal-400 shrink-0">
                    {dueCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Compact Sidebar Footer: Streak & Running Focus Session */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/90 space-y-3">
          {(pomodoro.isRunning ||
            pomodoro.secondsLeft < 25 * 60) && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/70 text-xs">
              <button
                type="button"
                onClick={() => handleSelectPage('pomodoro')}
                className="font-mono tabular-nums font-semibold text-teal-700 dark:text-teal-300 hover:underline whitespace-nowrap"
              >
                {pomodoro.mode === 'focus' ? 'Focus' : 'Break'}{' '}
                {formatTimerClock(pomodoro.secondsLeft)}
              </button>
              <button
                type="button"
                onClick={pomodoro.toggleStartPause}
                aria-label={pomodoro.isRunning ? 'Pause timer' : 'Resume timer'}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              >
                {pomodoro.isRunning ? (
                  <Pause className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
              <Flame className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-mono tabular-nums">
                {streak.currentStreak}d
              </span>{' '}
              streak
            </span>
            <span className="font-mono tabular-nums">
              {streak.freezesRemainingThisMonth}/2 freezes
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Strict 3-Zone Top Bar Contract */}
        <header className="sticky top-0 z-20 h-12 lg:h-14 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8 border-b border-slate-200 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-sm">
          {/* Zone 1: Single-line Brand / Breadcrumb */}
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0">
            <span className="lg:hidden font-display font-bold">GATE-Track</span>
            <span className="lg:hidden text-slate-400" aria-hidden="true">
              /
            </span>
            <span>{currentNav.label}</span>
          </div>

          {/* Zone 2: 4 concise single-line text links on Desktop */}
          <nav
            aria-label="Quick Jump"
            className="hidden md:flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400"
          >
            <button
              type="button"
              onClick={() => handleSelectPage('syllabus')}
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Syllabus
            </button>
            <button
              type="button"
              onClick={() => handleSelectPage('pyq')}
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Practice
            </button>
            <button
              type="button"
              onClick={() => handleSelectPage('mocks')}
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Mocks
            </button>
            <button
              type="button"
              onClick={() => handleSelectPage('planner')}
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Planner
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action Button */}
          <div className="flex items-center shrink-0">
            {activePage === 'pomodoro' ? (
              <button
                type="button"
                onClick={() => handleSelectPage('daily_log')}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                Log Study
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSelectPage('pomodoro')}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                {pomodoro.isRunning
                  ? `Focus ${formatTimerClock(pomodoro.secondsLeft)}`
                  : 'Start Focus'}
              </button>
            )}
          </div>
        </header>

        {/* Active Page Viewport */}
        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (56px height -> combined with 48px header stays <= 13% mobile viewport) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-14 bg-white/95 dark:bg-[#0F1522]/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 grid grid-cols-5"
      >
        {MOBILE_PRIMARY_TABS.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id && !mobileDrawerOpen;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectPage(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'text-teal-600 dark:text-teal-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>
                {item.shortLabel}
                {item.id === 'revision' && dueCount > 0 ? ` (${dueCount})` : ''}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setMobileDrawerOpen((o) => !o)}
          aria-expanded={mobileDrawerOpen}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors whitespace-nowrap ${
            mobileDrawerOpen
              ? 'text-teal-600 dark:text-teal-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {mobileDrawerOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <Menu className="w-4 h-4" />
          )}
          <span>More</span>
        </button>
      </nav>

      {/* Mobile Slide-Up Menu Drawer */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/50"
            />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.16 }}
              className="lg:hidden fixed bottom-14 inset-x-0 z-50 bg-white dark:bg-[#0F1522] border-t border-slate-200 dark:border-slate-800 rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  All GATE-Track Modules · {streak.currentStreak}d Streak
                </span>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="text-xs font-medium text-slate-600 dark:text-slate-300 px-2 py-1"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectPage(item.id)}
                      className={`flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm font-medium text-left transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300'
                          : 'bg-slate-100/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
