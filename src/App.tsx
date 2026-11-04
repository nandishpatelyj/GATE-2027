/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppStateProvider, useAppState } from './context/AppStateContext';
import { Layout } from './components/Layout';
import { BadgeToast } from './components/BadgeToast';
import { Dashboard } from './pages/Dashboard';
import { SyllabusPage } from './pages/SyllabusPage';
import { PyqTrackerPage } from './pages/PyqTrackerPage';
import { MockTestsPage } from './pages/MockTestsPage';
import { ErrorLogPage } from './pages/ErrorLogPage';
import { RevisionQueuePage } from './pages/RevisionQueuePage';
import { StudyPlannerPage } from './pages/StudyPlannerPage';
import { DailyLogPage } from './pages/DailyLogPage';
import { PomodoroPage } from './pages/PomodoroPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { SettingsPage } from './pages/SettingsPage';

const ActiveRouteView: React.FC = () => {
  const { activePage, streak } = useAppState();

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'syllabus':
        return <SyllabusPage />;
      case 'pyq':
        return <PyqTrackerPage />;
      case 'mocks':
        return <MockTestsPage />;
      case 'errors':
        return <ErrorLogPage />;
      case 'revision':
        return <RevisionQueuePage />;
      case 'planner':
        return <StudyPlannerPage />;
      case 'daily_log':
        return <DailyLogPage />;
      case 'pomodoro':
        return <PomodoroPage />;
      case 'resources':
        return <ResourcesPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderPage()}
      <BadgeToast
        badge={streak.newlyUnlockedBadge}
        onDismiss={streak.dismissUnlockedBadge}
      />
    </Layout>
  );
};

export default function App() {
  return (
    <AppStateProvider>
      <ActiveRouteView />
    </AppStateProvider>
  );
}
