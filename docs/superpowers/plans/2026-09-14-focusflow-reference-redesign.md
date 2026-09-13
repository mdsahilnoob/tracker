# FocusFlow Reference Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the incumbent FocusFlow UI with the approved warm peach/orange reference direction while preserving and completing the app's offline timer, tasks, insights, streaks, settings, and local notification behavior.

**Architecture:** Keep the existing flat Expo Router routes and three Zustand stores. Replace the shared UI layer with a compact design system and a custom floating navigation shell around Expo Router's `Slot`; keep AsyncStorage and pure domain utilities as the persistence/logic boundaries. Add local notification scheduling to the timestamp-based timer store and use `react-native-svg` for the reference-style progress ring and chart marks.

**Tech Stack:** Expo SDK 57, React Native 0.86, React 19, TypeScript, Expo Router, Zustand, AsyncStorage, Expo Haptics, Expo Notifications, `react-native-svg`, safe-area-context, and existing EAS configuration.

**Spec:** `docs/superpowers/specs/2026-09-14-focusflow-reference-redesign-design.md`

## Global Constraints

- Keep the existing Expo SDK 57 project and package manager; do not create a new Expo app.
- Preserve the current four V1 features: Focus Timer, Focus Tasks, Focus Insights and Session History, and Daily Goals and Streaks.
- Work fully offline with no backend, remote API, authentication, cloud sync, payments, subscriptions, advertisements, or remote analytics.
- Keep all user data local through `src/storage` and versioned AsyncStorage keys.
- Keep the timer timestamp-based; a display interval may refresh UI but may not be the source of truth.
- Use the supplied screenshot as visual DNA only; do not reproduce its avatar, artwork, pricing, upgrade, or lifetime-access content.
- Keep Android as the first release target while respecting safe areas, native back behavior, platform touch targets, and adaptive layout.
- Do not git commit or git push.

---

## File map

Create:

- `src/components/ui/icon.tsx` — cross-platform `SymbolView` icon wrapper with accessible, consistent sizing.
- `src/components/ui/surface.tsx` — warm reference surfaces and soft ambient background layer.
- `src/components/ui/floating-tab-bar.tsx` — accessible four-destination floating navigation capsule with central Focus action.
- `src/components/ui/field-sheet.tsx` — shared bottom sheet/modal presentation for task and numeric editors.
- `src/services/notifications.ts` — permission-safe local notification setup, scheduling, cancellation, and channel selection.
- `src/lib/notifications.ts` — pure notification copy/channel helpers covered by tests.

Modify:

- `package.json`, `package-lock.json` — add Expo-compatible `expo-notifications` and `react-native-svg`.
- `app.json` — add the notifications config plugin, enable Android predictive back, and preserve existing app metadata.
- `src/app/_layout.tsx` — render `Slot`, initialize local notification handling, and keep hydration/splash behavior.
- `src/components/app-tabs.tsx` — become the universal navigation shell that renders the route slot and floating tab bar.
- `src/components/ui/app-screen.tsx`, `button.tsx`, `card.tsx`, `section-header.tsx`, `progress-bar.tsx`, `empty-state.tsx` — replace incumbent styling with reference tokens and accessible states.
- `src/components/focus/timer-ring.tsx` — render a real SVG arc with a visible progress knob and active/paused states.
- `src/constants/theme.ts`, `src/hooks/use-app-theme.ts` — define light/dark warm surface tokens, orange action accent, typography, and spacing.
- `src/stores/use-focus-store.ts` — schedule/cancel notifications around start, pause, resume, stop, completion, hydration, and clear-data operations.
- `src/app/index.tsx` — rebuild Focus as the first-viewport working instrument with dynamic timer controls and local summary.
- `src/app/tasks.tsx` — rebuild task list/create/edit/complete/delete/start interactions with the new surface grammar.
- `src/app/insights.tsx`, `src/app/session/[id].tsx` — rebuild chart, streak, history, and session detail surfaces.
- `src/app/settings.tsx` — rebuild grouped settings rows, presets, toggles, destructive deletion, and privacy copy.
- `tests/logic.test.ts` — add pure notification helper coverage and timer notification preference behavior where testable.

Remove from active use or delete if no imports remain after the replacement:

- `src/components/app-tabs.web.tsx`, `src/components/web-badge.tsx`, `src/components/hint-row.tsx`, `src/components/themed-text.tsx`, `src/components/themed-view.tsx`, `src/components/animated-icon.tsx`, `src/components/animated-icon.web.tsx`, `src/components/animated-icon.module.css`, and `src/components/ui/collapsible.tsx`.

---

### Task 1: Add notification and progress-ring foundations with tests

**Files:**

- Modify: `package.json`, `package-lock.json`
- Modify: `app.json`
- Create: `src/lib/notifications.ts`
- Create: `src/services/notifications.ts`
- Modify: `tests/logic.test.ts`

**Interfaces:**

- `buildFocusCompletionContent(taskTitle: string | undefined, minutes: number): { title: string; body: string }` returns deterministic local-notification copy.
- `getFocusNotificationChannelId(soundEnabled: boolean): 'focus-complete-sound' | 'focus-complete-silent'` returns the Android channel selected for the current sound preference.
- `prepareLocalNotifications(): Promise<void>` configures the foreground handler and Android channels without requesting permission.
- `requestNotificationPermission(): Promise<boolean>` returns `false` on web, denial, or native error and never throws.
- `scheduleFocusCompletion(timer: ActiveTimerState, options: { soundEnabled: boolean }): Promise<string | undefined>` requests permission when needed and schedules a one-shot date notification.
- `cancelFocusCompletion(notificationId: string | undefined): Promise<void>` safely cancels a scheduled notification.

- [ ] **Step 1: Write the failing pure helper tests.**

Add to `tests/logic.test.ts`:

```ts
import {
  buildFocusCompletionContent,
  getFocusNotificationChannelId,
} from '../src/lib/notifications.ts';

test('builds local completion copy with task snapshot and duration', () => {
  assert.deepEqual(buildFocusCompletionContent('Write tests', 25), {
    title: 'Focus session complete',
    body: '25 minutes on Write tests. Nice work.',
  });
  assert.deepEqual(buildFocusCompletionContent(undefined, 45), {
    title: 'Focus session complete',
    body: '45 minutes of focus complete. Nice work.',
  });
});

test('selects separate Android notification channels for sound preference', () => {
  assert.equal(getFocusNotificationChannelId(true), 'focus-complete-sound');
  assert.equal(getFocusNotificationChannelId(false), 'focus-complete-silent');
});
```

- [ ] **Step 2: Run the new tests to verify the expected failure.**

Run: `npm test`

Expected: FAIL because `src/lib/notifications.ts` does not exist yet.

- [ ] **Step 3: Install the Expo-compatible native packages.**

Run: `npx expo install expo-notifications react-native-svg`

Use the versions selected by Expo SDK 57; do not manually choose newer versions.

- [ ] **Step 4: Implement the pure helpers and notification service.**

Use the Expo SDK 57 notification API with a date trigger, safe permission checks, and Android channels. The scheduling shape is:

```ts
await Notifications.scheduleNotificationAsync({
  content: {
    ...buildFocusCompletionContent(timer.taskTitle, timer.plannedDurationMinutes),
    sound: options.soundEnabled ? 'default' : undefined,
  },
  trigger: {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: new Date(timer.expectedEndAt),
    channelId: getFocusNotificationChannelId(options.soundEnabled),
  },
});
```

Guard all native calls with `Platform.OS !== 'web'`, catch permission/native errors, and return `undefined` instead of failing a focus session. Use `shouldShowBanner` and `shouldShowList` in the foreground handler. Add `expo-notifications` to the Expo plugins array and leave unrelated permissions untouched.

- [ ] **Step 5: Run the tests to verify the helper implementation passes.**

Run: `npm test`

Expected: PASS, including the original timer/date/analytics/streak tests.

---

### Task 2: Replace the theme and navigation shell

**Files:**

- Modify: `src/constants/theme.ts`
- Modify: `src/hooks/use-app-theme.ts`
- Modify: `src/app/_layout.tsx`
- Modify: `src/components/app-tabs.tsx`
- Create: `src/components/ui/icon.tsx`
- Create: `src/components/ui/surface.tsx`
- Create: `src/components/ui/floating-tab-bar.tsx`
- Modify: `src/components/ui/app-screen.tsx`, `button.tsx`, `card.tsx`, `section-header.tsx`, `progress-bar.tsx`, `empty-state.tsx`
- Remove after import audit: `src/components/app-tabs.web.tsx`, `src/components/web-badge.tsx`, `src/components/hint-row.tsx`, `src/components/themed-text.tsx`, `src/components/themed-view.tsx`, `src/components/animated-icon.tsx`, `src/components/animated-icon.web.tsx`, `src/components/animated-icon.module.css`, `src/components/ui/collapsible.tsx`

**Interfaces:**

- `Colors.light` and `Colors.dark` expose `text`, `textSecondary`, `background`, `backgroundElement`, `backgroundSelected`, `border`, `muted`, `danger`, `accentSoft`, `navBackground`, and `navInactive`.
- `Icon` accepts `{ name: { ios: string; android: string; web: string }; size?: number; color?: string; label?: string }` and uses `SymbolView` with a platform fallback.
- `Surface` accepts `{ children; style?; elevated?: boolean }` and provides the shared white rounded work surface.
- `FloatingTabBar` renders four destinations (`Focus`, `Tasks`, `Insights`, `Settings`) and a center action that routes to `/`.

- [ ] **Step 1: Write a small failing navigation helper test only if a pure route helper is introduced.** If navigation stays inside the component, skip new production helpers and use typecheck/manual route checks instead.

- [ ] **Step 2: Implement the warm token system.**

Use near-black ink, warm off-white background, peach ambient surface, saturated orange accent, charcoal navigation, 12–18 px control radii, and 22–28 px content-surface radii. Keep dark mode as a deliberate palette with warm charcoal surfaces and readable orange contrast. Remove the old starter comments and demo-only font tokens.

- [ ] **Step 3: Implement the universal route shell.**

Change `AppTabs` to render `<Slot />` inside a flex container and overlay `FloatingTabBar` with safe-area bottom padding. Use `usePathname` to mark the active destination, `router.replace` for the four top-level routes, and hide the floating bar on `/session/*` detail routes. Keep the center action accessible as “Start a focus session”.

- [ ] **Step 4: Replace the shared primitives.**

`AppScreen` must apply top/side/bottom insets and reserve enough bottom space for the floating capsule. `Button` must include primary, secondary, ghost, danger, pressed, disabled, and loading states with a 48 dp minimum height. `Icon` must replace text glyphs and emoji. `Card`/`Surface` use one consistent elevation language, not border-plus-shadow stacking. `EmptyState` must use the real icon wrapper and a useful next action.

- [ ] **Step 5: Run static checks.**

Run: `npx tsc --noEmit`

Expected: PASS or only errors caused by screens not yet migrated; record any remaining errors and resolve them before Task 3.

---

### Task 3: Integrate notifications into the timestamp-based focus store

**Files:**

- Modify: `src/stores/use-focus-store.ts`
- Modify: `src/app/_layout.tsx`
- Modify: `src/app/index.tsx`
- Modify: `src/types/models.ts` only if the persisted timer needs a new strongly typed field

**Interfaces:**

- `startTimer(input)` accepts `notificationsEnabled?: boolean` and `soundEnabled?: boolean` preferences in addition to duration/task data.
- `resumeTimer(options?: { notificationsEnabled?: boolean; soundEnabled?: boolean })` reschedules after extending `expectedEndAt`.
- Existing `pauseTimer`, `finishTimer`, `completeTimer`, and `clearSessions` cancel any stored notification before clearing the active timer.

- [ ] **Step 1: Add the store-level regression test setup.** Extend the existing test file only for pure behavior that can be exercised without AsyncStorage/native modules; keep notification scheduling integration manual because it requires native APIs.

- [ ] **Step 2: Update the timer store in red-green order.**

Preserve the current state machine and timestamp calculations. On start, create the timer, schedule a completion notification if enabled, persist the timer with the returned `notificationId`, and set state. On pause, cancel and remove the notification. On resume, extend `expectedEndAt` by the paused duration and schedule a new notification if enabled. On finish/completion/hydration/clear, cancel any existing notification before removing active-timer storage. All notification failures must leave timer/session persistence usable.

- [ ] **Step 3: Initialize notification handling after store hydration.** Call `prepareLocalNotifications()` once from root layout without prompting for permission. Permission is requested only when the user starts a timer with notifications enabled.

- [ ] **Step 4: Verify domain behavior.**

Run: `npm test`

Expected: PASS with no change to timestamp timer, midnight split, streak, or analytics behavior.

---

### Task 4: Rebuild the Focus screen and SVG timer ring

**Files:**

- Modify: `src/app/index.tsx`
- Modify: `src/components/focus/timer-ring.tsx`
- Create or modify: `src/components/ui/field-sheet.tsx`

**Interfaces:**

- `TimerRing({ time, progress, status, size? })` renders an accessible SVG background circle, orange `Circle` arc using `strokeDasharray`/`strokeDashoffset`, centered countdown/status, and a round progress marker.
- Focus screen retains `taskId` deep-link handling and uses `useFocusStore`, `useTasksStore`, and `useSettingsStore` as the only data sources.

- [ ] **Step 1: Write the failing ring contract test only if a pure `getRingProgress` helper is extracted; otherwise treat SVG rendering as a component-only change and verify through typecheck/manual capture.**

- [ ] **Step 2: Replace the ring implementation.**

Use `react-native-svg` `Svg` and `Circle`, with a 270-degree visual arc matching the reference's open orange dial. Keep the full track visible, use rounded stroke caps, render the active task/status below the countdown, and expose an accessibility label such as “24 minutes 32 seconds remaining, In focus”.

- [ ] **Step 3: Rebuild the first viewport.**

Structure the screen as:

1. greeting/status row with FocusFlow mark and a local notification affordance;
2. optional task summary row showing selected task and planned duration;
3. large white focus surface with the ring and primary action controls;
4. duration presets/custom duration and task chips before start;
5. Today summary with focus time, sessions, and daily goal progress.

Use no paywall or upgrade content. Start, pause, resume, and end-session controls call the existing store methods. Keep stop confirmation and goal celebration behavior. Validate custom duration from 1–180 minutes before calling `startTimer`.

- [ ] **Step 4: Verify focus interactions.**

Run: `npm test` and `npx tsc --noEmit`

Then manually verify: start twice does not duplicate, pause freezes remaining time, resume extends end time, navigating away preserves the timer, and an expired persisted timer completes once on return.

---

### Task 5: Rebuild Tasks with working task CRUD

**Files:**

- Modify: `src/app/tasks.tsx`
- Modify or create: `src/components/ui/field-sheet.tsx`

**Interfaces:**

- `FieldSheet` accepts `visible`, `title`, `value`, `placeholder`, `submitLabel`, `onChangeText`, `onCancel`, and `onSubmit`.
- Task screen keeps `addTask`, `updateTask`, `deleteTask`, `setCompleted`, and task-start deep-link behavior unchanged.

- [ ] **Step 1: Add a validation test for the task-name normalization helper if one is extracted; otherwise keep validation inline and rely on manual interaction coverage.**

- [ ] **Step 2: Replace the list visual language.**

Use a warm page, strong “Tasks” title, active count, white work surfaces, orange circular completion controls, task title, focus/session metadata, and compact icon actions. Keep completed tasks in a quieter grouped section with restore and delete actions. Use `Icon` instead of glyph text for edit, delete, play, and completion controls.

- [ ] **Step 3: Implement create/edit sheet behavior.**

The sheet accepts only a task name, trims whitespace, rejects empty input without closing, limits to 120 characters, and closes after successful add/update. Support keyboard submit and accessible cancel/save actions.

- [ ] **Step 4: Verify CRUD end to end.**

Manually create, edit, complete, restore, delete, start focus from an active task, and confirm the task-title snapshot remains visible in an existing session after task deletion. Run `npx tsc --noEmit`.

---

### Task 6: Rebuild Insights and session details from real data

**Files:**

- Modify: `src/app/insights.tsx`
- Modify: `src/app/session/[id].tsx`

**Interfaces:**

- Keep `getTodayStats`, `getLast7Days`, `getMonthlyStats`, `getLongestSession`, `calculateCurrentStreak`, `calculateLongestStreak`, and `didMeetGoalOnDate` as the only sources for displayed metrics.
- Session detail continues to navigate by `/session/:id` and calls `deleteSession` after destructive confirmation.

- [ ] **Step 1: Preserve the existing analytics tests as the red/green guard.** Add no fixture data to the UI. Empty sessions must render an educational empty state, not synthetic values.

- [ ] **Step 2: Build the reference-style status layout.**

Use a “Status”/“Insights” header, two today metric surfaces, a “Your Focus Progress” white chart surface with orange bars and a seven-day selector label, month metrics, and the daily-goal streak row with seven goal dots. Keep values derived from the real session array and current local date key.

- [ ] **Step 3: Rebuild session history and detail.**

History is chronological, grouped by local date, and each row has a real icon, task-title snapshot, duration, time, and status. Session detail uses the same surfaces, accessible back action, status/dates/durations, and delete confirmation. If an ID is missing, show a useful not-found state with a back action.

- [ ] **Step 4: Verify recalculation.**

Run: `npm test`

Manually delete a historical session and confirm today/month/streak/history values update immediately without restarting the app.

---

### Task 7: Rebuild Settings and complete configuration cleanup

**Files:**

- Modify: `src/app/settings.tsx`
- Modify: `app.json`
- Modify: `README.md` only if run/build instructions or offline/privacy wording is stale

**Interfaces:**

- Settings continue to call `updateSettings`, `resetSettings`, `clearSessions`, and `clearTasks` through existing stores.
- Numeric editor validates focus duration `1..180` and daily goal `1..1440` before saving.

- [ ] **Step 1: Add a pure numeric validation test if a shared validator is extracted.** Otherwise preserve existing `storage/settings.ts` validation tests/behavior and manually cover the sheets.

- [ ] **Step 2: Replace Settings with grouped native-friendly rows.**

Keep sections for Focus, Timer, Appearance, Data, and About. Use large rows, orange selected presets, a familiar switch row for haptics/sound/notifications, theme selection, accent swatches with labels, local session count, privacy copy, and destructive delete-all confirmation. Ensure `soundEnabled` and `notificationsEnabled` are visible and actually flow into timer behavior.

- [ ] **Step 3: Verify persistence and dark mode.**

Manually change focus duration, daily goal, haptics, sound, notifications, theme, and accent; reload the app and confirm values persist. Delete all data and confirm tasks/sessions/active timer reset while settings return to defaults. Run `npx tsc --noEmit`.

- [ ] **Step 4: Clean app configuration.**

Keep the existing name, version, icons, EAS profiles, portrait orientation, and Android package placeholder. Add only the notification plugin required by the new service and set `android.predictiveBackGestureEnabled` to `true` so system Back remains available. Do not add payment or unrelated permissions.

---

### Task 8: Remove starter visual remnants and verify the complete app

**Files:**

- Remove unused starter components listed in the file map after running `rg` import audit.
- Modify: `README.md` if it still describes starter UI rather than FocusFlow.
- Modify: `docs/superpowers/specs/2026-09-14-focusflow-reference-redesign-design.md` only if implementation reveals a necessary clarification.

- [ ] **Step 1: Audit imports and forbidden scope.**

Run:

```text
rg -n "web-badge|HintRow|ThemedText|ThemedView|AnimatedIcon|Collapsible|expo-logo|React logo|Tomato\+|upgrade|subscription|payment|stripe|fetch\(|axios|http" src app.json package.json README.md
```

Expected: no active starter/demo, paywall, payment, or remote-network references. Existing privacy/docs URLs may remain only where they are documentation, not runtime dependencies.

- [ ] **Step 2: Run all automated checks.**

Run:

```text
npm test
npx tsc --noEmit
npm run lint
npx expo-doctor
```

Expected: all configured checks pass. Fix implementation errors before visual QA.

- [ ] **Step 3: Run the offline/manual matrix.**

With airplane mode enabled, verify app launch, task CRUD, timer start/pause/resume/stop, background/reopen restoration, session completion, session history, insight recalculation, goals/streaks, settings/theme, and notification-denial fallback. Confirm no screen waits for network.

- [ ] **Step 4: Run native visual QA.**

Build/run the existing Expo app on an Android phone-size emulator or device. Inspect Focus, Tasks, Insights, Settings, and Session Detail at the shipped device class; confirm safe-area spacing, 48 dp targets, keyboard/sheet behavior, Android system Back, dark mode, and larger font scale. Capture screenshots into `.impeccable/review/phone-android.png` if the native harness is available.

- [ ] **Step 5: Run the Impeccable native finish pass.**

Use the approved redesign spec, the craft-floor/native references, and the captured Android evidence to check the committed reference DNA, content/state coverage, accessibility, and platform conventions. Do not run the web-only mechanical detector on this native Expo surface.

---

## Plan self-review

- Spec coverage: reference DNA, Focus, Tasks, Insights, Settings, data flow, interaction/error behavior, offline constraints, and out-of-scope commerce/backend concerns are covered by Tasks 1–8.
- Placeholder scan: no `TBD`, `TODO`, or unspecified implementation steps are present; optional component-only tests are explicitly bounded to cases where a pure helper is actually extracted.
- Type consistency: `ActiveTimerState.notificationId`, the notification service signatures, store preference inputs, and route paths are named consistently throughout.
- User constraint: no commit or push steps are included.
