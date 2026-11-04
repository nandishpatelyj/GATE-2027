import { BadgeDefinition } from '../types';

export const STREAK_BADGES: BadgeDefinition[] = [
  {
    days: 7,
    id: 'streak_7',
    title: 'First Vector',
    description: '7 consecutive days of active GATE DA study or completed tasks.',
  },
  {
    days: 21,
    id: 'streak_21',
    title: 'Convergence',
    description: '21-day habit milestone — three full weeks of steady preparation.',
  },
  {
    days: 50,
    id: 'streak_50',
    title: 'Eigenstate',
    description: '50-day study streak across theory, PYQs, and spaced revision.',
  },
  {
    days: 75,
    id: 'streak_75',
    title: 'Top Rank Contender',
    description: '75 days of unbroken momentum heading into GATE DA.',
  },
];

export const SPACED_REVISION_INTERVALS = [1, 3, 7, 21, 45] as const;
export const MAX_MONTHLY_FREEZES = 2;
