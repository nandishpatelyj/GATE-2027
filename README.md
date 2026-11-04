# GATE-Track — GATE 2027 Data Science & AI (DA) Preparation Tracker

GATE-Track is a single-page web application designed for candidates preparing for the **GATE 2027 Data Science & Artificial Intelligence (DA)** examination. It tracks syllabus mastery, daily study streaks, PYQ accuracy, full-length mock test trends, mistake analysis, and spaced repetition revisions.

## Key Features

- **Live Countdown & Dashboard**: Real-time days and hours remaining until the configurable GATE 2027 DA exam date (default: `2027-02-06`), daily auto-curated tasks, GitHub-style study heatmap, subject strength radar chart, and post-6 PM study reminder.
- **Complete GATE DA Syllabus Tracker**: Pre-seeded across all 8 official sections (Probability & Statistics, Linear Algebra, Calculus & Optimization, Programming & DSA, Databases & Warehousing, Machine Learning, Artificial Intelligence, General Aptitude) with 4 mastery stages (`Not started → Learning → Practised → Revised`), importance levels, and custom video/notes links.
- **PYQ & Practice Tracker**: Question-level logging with source, result, time spent, revisit bookmarking, per-topic accuracy calculation, and automatic highlighting of weak topics (`< 60%` accuracy).
- **Mock Test Analytics**: Score trend line chart, target score gauge, subject-wise average bar chart, and detailed full-length mock logs.
- **Error Log (Mistake Notebook)**: Categorize errors (`Concept gap`, `Calculation`, `Silly`, `Time pressure`, `Misread`), analyze mistake distributions, and automatically schedule spaced reviews.
- **Spaced Revision Queue**: Topics marked `Practised` and error-log entries resurface automatically at `1, 3, 7, 21, 45` day intervals with Done and Postpone actions.
- **Backward Study Planner**: Auto-generates a 5-phase preparation roadmap backward from the exam date and provides an editable weekly schedule.
- **Daily Log & Pomodoro Timer**: Subject-wise study hour logging, mood and reflection journal, monthly log calendar, and a 25/5 Pomodoro timer that automatically credits completed sessions to the day's study log.
- **Streaks, Freezes & Badges**: Counts days with at least 30 minutes studied or 1 task completed, grants 2 streak freezes per month, and unlocks confetti milestone badges at `7, 21, 50, 75` days.
- **Portable Storage Layer**: Persists locally via `localStorage` behind a clean `StorageAdapter` interface (`src/utils/storage.ts`) ready to swap for Supabase, with full JSON export/import and reset controls.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Deploying to Vercel

GATE-Track is configured out-of-the-box for zero-config static SPA deployment on Vercel (`vercel.json` included).

### Option 1: Deploy via GitHub Integration (Recommended)

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Sign in to [Vercel](https://vercel.com) and click **Add New... → Project**.
3. Import your `gate-track` repository.
4. Verify the detected build settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**. Vercel will build the TypeScript + Vite bundle and apply the SPA rewrite rules from `vercel.json`.

### Option 2: Deploy via Vercel CLI

```bash
npm install -g vercel
npm run build
vercel --prod
```

## Swapping Storage to Supabase Later

All state persistence flows through `storageAdapter` in `src/utils/storage.ts`. To migrate from `localStorage` to Supabase later, implement the `StorageAdapter` interface backed by a `user_state` table (keyed by `user_id` and `storage_key`) and pass your adapter instance to `setActiveStorageAdapter()`.
