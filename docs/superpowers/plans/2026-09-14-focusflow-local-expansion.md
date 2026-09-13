# FocusFlow Local Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved offline-only productivity features to the existing FocusFlow Expo app while excluding privacy lock and home-screen widgets.

**Architecture:** Extend the existing typed models, AsyncStorage abstraction, Zustand stores, pure analytics, and four screens. Migrate v1 data into normalized v2 records, keep timer timestamps authoritative, and add shared Reanimated primitives rather than screen-specific animation code.

**Tech Stack:** Expo SDK 57, React Native 0.86, TypeScript, Expo Router, Zustand, AsyncStorage, Reanimated 4, Expo Haptics, Expo Notifications, Expo FileSystem/Sharing only where required for local export/import.

**Spec:** `docs/superpowers/specs/2026-09-14-focusflow-local-expansion-design.md`

## Global Constraints

- Keep all data and calculations on-device; no backend, accounts, cloud sync, payments, ads, or remote analytics.
- Preserve the existing Expo-managed project, Expo Router routes, four-tab navigation, and current visual direction.
- Preserve v1 data through validated migration; never discard valid tasks, sessions, settings, or active timers.
- Keep timestamp-based timer state authoritative and avoid AsyncStorage writes every second.
- Exclude privacy lock and home-screen widget features.
- Use Expo SDK 57-compatible package versions and current official docs before adding Expo packages.
- Every interactive control must be functional, accessible, and safe when storage or OS permissions fail.
- Do not create a commit or push to git.

---

### Task 1: Add v2 models, validators, and migration-safe storage

**Files:**
- Modify: `src/types/models.ts`
- Modify: `src/storage/index.ts`
- Modify: `src/storage/tasks.ts`
- Modify: `src/storage/sessions.ts`
- Modify: `src/storage/settings.ts`
- Create: `src/storage/plans.ts`
- Create: `src/storage/templates.ts`
- Create: `src/storage/reminders.ts`
- Create: `src/storage/achievements.ts`
- Test: `tests/logic.test.ts`

**Interfaces:**
- `normalizeFocusTask(value: unknown): FocusTask | null`
- `normalizeFocusSession(value: unknown): FocusSession | null`
- `loadDailyPlan(dateKey: string): Promise<DailyPlanItem[]>`
- `saveDailyPlan(dateKey: string, items: DailyPlanItem[]): Promise<void>`
- `loadTemplates(): Promise<FocusTemplate[]>`
- `loadReminders(): Promise<Reminder[]>`
- `loadAchievements(): Promise<AchievementUnlock[]>`

- [ ] **Step 1: Write failing tests** for v1 task/session normalization, recurring task defaults, invalid import records, and plan ordering.
- [ ] **Step 2: Run `rtk npm test`** and confirm the new tests fail because the v2 types and normalizers do not exist.
- [ ] **Step 3: Add the typed entities and v2 key namespace.** Keep legacy v1 keys readable and normalize missing fields with deterministic defaults.
- [ ] **Step 4: Implement safe loaders/savers** for plans, templates, reminders, and achievements using the existing `readJson`/`writeJson` boundary.
- [ ] **Step 5: Implement one-time v1-to-v2 migration** that validates before writing and removes a legacy key only after a successful v2 write.
- [ ] **Step 6: Run `rtk npm test` and `rtk npx tsc --noEmit`** and confirm all tests and types pass.

### Task 2: Add task priorities, tags, recurrence, search, and daily planning

**Files:**
- Modify: `src/stores/use-tasks-store.ts`
- Create: `src/stores/use-plan-store.ts`
- Modify: `src/app/tasks.tsx`
- Modify: `src/app/index.tsx`
- Create: `src/components/tasks/task-filter-bar.tsx`
- Create: `src/components/tasks/task-editor-sheet.tsx`
- Create: `src/components/tasks/daily-plan-card.tsx`
- Modify: `src/lib/analytics.ts`
- Test: `tests/logic.test.ts`

**Interfaces:**
- `addTask(input: CreateTaskInput): Promise<FocusTask | null>`
- `updateTask(id: string, patch: UpdateTaskInput): Promise<void>`
- `getTaskDueState(task: FocusTask, dateKey: string): 'due' | 'complete' | 'upcoming'`
- `getFilteredTasks(tasks: FocusTask[], query: string, filters: TaskFilters): FocusTask[]`
- `setPlanItems(dateKey: string, items: DailyPlanItem[]): Promise<void>`

- [ ] **Step 1: Write failing pure tests** for recurrence due-state rules, tag/priority filtering, normalized search, and plan totals.
- [ ] **Step 2: Run `rtk npm test`** and confirm the tests fail for the intended missing helpers.
- [ ] **Step 3: Extend the task store** with priority, tags, recurrence, and recurring completion-date operations while preserving the existing simple CRUD calls.
- [ ] **Step 4: Add the plan store** with add, reorder, remove, and “start planned task” behavior for the current local date.
- [ ] **Step 5: Replace the task editor UI** with title, priority, comma-separated tags, and recurrence controls; keep empty-title validation and delete confirmation.
- [ ] **Step 6: Add search/filter/sort controls** and display plan selection/actions without creating a new navigation system.
- [ ] **Step 7: Add the Today plan card to Focus** and make it feed task selection into the existing timer.
- [ ] **Step 8: Run focused tests, typecheck, and lint** before continuing.

### Task 3: Add Pomodoro cycles and focus templates

**Files:**
- Modify: `src/types/models.ts`
- Modify: `src/stores/use-focus-store.ts`
- Modify: `src/stores/use-settings-store.ts`
- Modify: `src/lib/timer.ts`
- Modify: `src/app/index.tsx`
- Modify: `src/components/focus/timer-ring.tsx`
- Create: `src/components/focus/mode-picker.tsx`
- Create: `src/components/focus/template-picker.tsx`
- Test: `tests/logic.test.ts`

**Interfaces:**
- `createPomodoroTimer(input: PomodoroTimerInput): ActiveTimerState`
- `advancePomodoroPhase(timer: ActiveTimerState, nowMs: number): ActiveTimerState | null`
- `getPhaseLabel(timer: ActiveTimerState): string`
- `getDefaultTemplates(settings: UserSettings): FocusTemplate[]`

- [ ] **Step 1: Write failing tests** for phase durations, cycle advancement, paused break time, and focus-only session accounting.
- [ ] **Step 2: Run `rtk npm test`** and confirm the new timer tests fail.
- [ ] **Step 3: Extend the timer model and pure helpers** with `free` and `pomodoro` modes, focus/short-break/long-break phases, cycle counts, and timestamp-safe pause/resume.
- [ ] **Step 4: Update the focus store** so focus completion creates a session, break completion advances state, and stop/discard cancels the correct notification.
- [ ] **Step 5: Add mode/template pickers** with persisted custom defaults and preset templates.
- [ ] **Step 6: Update Focus UI** for cycle status, break actions, skip break, and completion copy while retaining free-focus behavior.
- [ ] **Step 7: Run timer tests, full tests, typecheck, and lint.**

### Task 4: Add session notes, local reminders, and completion fallback

**Files:**
- Modify: `src/types/models.ts`
- Modify: `src/stores/use-focus-store.ts`
- Create: `src/stores/use-reminder-store.ts`
- Modify: `src/services/notifications.ts`
- Create: `src/lib/reminders.ts`
- Modify: `src/app/settings.tsx`
- Modify: `src/app/session/[id].tsx`
- Create: `src/components/reminders/reminder-editor-sheet.tsx`
- Test: `tests/logic.test.ts`

**Interfaces:**
- `getReminderOccurrences(reminder: Reminder, from: Date, days: number): ReminderOccurrence[]`
- `scheduleReminder(reminder: Reminder): Promise<string[]>`
- `cancelReminder(reminder: Reminder): Promise<void>`
- `updateSessionNotes(id: string, notes: string): Promise<void>`

- [ ] **Step 1: Write failing tests** for weekday recurrence, local reminder validation, and trimmed note limits.
- [ ] **Step 2: Run `rtk npm test`** and confirm the tests fail.
- [ ] **Step 3: Add local reminder entities and pure occurrence calculation** using local date/time values and safe bounds.
- [ ] **Step 4: Extend the notification service** with lazy native loading, reminder scheduling/cancellation, and no-op behavior for web/Expo Go/denied permission.
- [ ] **Step 5: Add session note editing** with safe trimming and persistence; show notes in session details and history when present.
- [ ] **Step 6: Add reminder controls to Settings** with enabled state, weekday/time editor, task/goal copy, and destructive-safe cancellation.
- [ ] **Step 7: Run tests, typecheck, lint, and web export.**

### Task 5: Add local export/import backup

**Files:**
- Create: `src/services/backup.ts`
- Create: `src/lib/backup.ts`
- Modify: `src/storage/index.ts`
- Modify: `src/app/settings.tsx`
- Test: `tests/logic.test.ts`
- Modify: `package.json` and `package-lock.json` only if Expo-compatible file/share packages are required

**Interfaces:**
- `buildBackupSnapshot(): Promise<FocusFlowBackup>`
- `validateBackup(value: unknown): FocusFlowBackup | null`
- `restoreBackup(snapshot: FocusFlowBackup): Promise<void>`
- `serializeBackupCsv(snapshot: FocusFlowBackup): string`

- [ ] **Step 1: Write failing pure tests** for backup schema validation, malformed data rejection, and CSV escaping.
- [ ] **Step 2: Run `rtk npm test`** and confirm failure.
- [ ] **Step 3: Implement a versioned backup envelope** containing tasks, sessions, settings, active timer, plans, templates, reminders, and achievements.
- [ ] **Step 4: Implement atomic-ish restore**: validate the full envelope first, then write all local entities and reload stores only after writes finish.
- [ ] **Step 5: Add Android-friendly local file/share actions** using Expo-compatible APIs; on web offer a browser download and file input where supported.
- [ ] **Step 6: Add Settings UI** for Export JSON, Export CSV, Import backup, and clear error/success feedback.
- [ ] **Step 7: Run tests, typecheck, lint, and web export.**

### Task 6: Expand insights and add offline achievements

**Files:**
- Modify: `src/lib/analytics.ts`
- Create: `src/lib/achievements.ts`
- Modify: `src/app/insights.tsx`
- Modify: `src/components/ui/progress-bar.tsx`
- Create: `src/components/insights/trend-chart.tsx`
- Create: `src/components/insights/achievement-card.tsx`
- Test: `tests/logic.test.ts`

**Interfaces:**
- `getProductivityTrends(sessions: FocusSession[], range: TrendRange): ProductivityTrend[]`
- `getMostProductiveDay(sessions: FocusSession[], timezone?: string): string | null`
- `evaluateAchievements(input: AchievementInput): AchievementUnlock[]`
- `getAchievementProgress(id: AchievementId, input: AchievementInput): AchievementProgress`

- [ ] **Step 1: Write failing tests** for trend aggregation, best-day selection, task trends, and achievement unlock thresholds.
- [ ] **Step 2: Run `rtk npm test`** and confirm failure.
- [ ] **Step 3: Add pure analytics** for rolling ranges, averages, best days, completed/interrupted ratios, and task-level trends.
- [ ] **Step 4: Add deterministic achievement evaluation** derived from current sessions/goals/tasks and persist only unlock timestamps.
- [ ] **Step 5: Rebuild Insights UI** with animated trend chart, richer summary cards, goal history, notes indicators, and achievement progress.
- [ ] **Step 6: Run tests, typecheck, lint, and web export.**

### Task 7: Add reusable animation and motion accessibility system

**Files:**
- Create: `src/hooks/use-reduced-motion.ts`
- Create: `src/components/ui/animated-pressable.tsx`
- Create: `src/components/ui/animated-fade-in.tsx`
- Create: `src/components/ui/animated-list-item.tsx`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/floating-tab-bar.tsx`
- Modify: `src/app/index.tsx`
- Modify: `src/app/tasks.tsx`
- Modify: `src/app/insights.tsx`
- Modify: `src/app/settings.tsx`

**Interfaces:**
- `useReducedMotion(): boolean`
- `AnimatedPressable(props): JSX.Element`
- `AnimatedFadeIn(props): JSX.Element`

- [ ] **Step 1: Write a pure test** for motion duration selection when reduced motion is enabled/disabled.
- [ ] **Step 2: Run `rtk npm test`** and confirm failure.
- [ ] **Step 3: Implement shared motion primitives** with bounded durations and reduced-motion fallback.
- [ ] **Step 4: Apply press, entrance, layout, timer pulse, progress, chart, tab, sheet, and goal celebration animations** without changing the state contracts.
- [ ] **Step 5: Ensure animation callbacks do not write storage and do not create per-second full-screen rerenders.**
- [ ] **Step 6: Run full tests, typecheck, lint, and web export.**

### Task 8: Final integration audit

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-09-14-focusflow-local-expansion-design.md` if implementation decisions materially change
- Test: `tests/logic.test.ts`

- [ ] **Step 1: Run `rtk npm test`.**
- [ ] **Step 2: Run `rtk npx tsc --noEmit`.**
- [ ] **Step 3: Run `rtk npm run lint`.**
- [ ] **Step 4: Run `rtk npx expo export --platform web`.**
- [ ] **Step 5: Search `src`, `app.json`, and `package.json` for backend, payments, ads, authentication, remote API calls, and excluded privacy-lock/widget code.**
- [ ] **Step 6: Inspect `rtk git diff --check` and `rtk git status --short`; do not commit or push.**
- [ ] **Step 7: Report any native-device limitation explicitly rather than claiming unverified Android behavior.**
