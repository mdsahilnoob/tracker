# FocusFlow reference redesign

## Status

Approved in chat on 2026-09-14. This document translates the supplied reference image into a product-specific visual and interaction contract. The reference is inspiration for structure and visual DNA; its pricing screen and copy are excluded by the free-app requirement.

## Product and surface

FocusFlow is a local-first focus timer for people doing their own work on a phone. The app has four top-level tasks: Focus, Tasks, Insights, and Settings. The redesign replaces the incumbent visual system across those routes while preserving existing timer, task, analytics, streak, storage, haptics, and notification behavior.

The shipped surface is an adaptive Expo native app, Android-first. It should feel native in safe-area handling, touch targets, back navigation, keyboard behavior, and system theme support while carrying the visual character extracted from the reference.

## Reference DNA

- **Surface:** light, warm neutral background with a soft peach/orange ambient wash behind content; white surfaces create calm contrast.
- **Anchor accent:** saturated orange, reserved for primary actions, timer progress, selected controls, and completion states.
- **Ink:** near-black primary text and charcoal navigation chrome; secondary text is warm gray with accessible contrast.
- **Geometry:** large rounded content surfaces, compact rounded controls, and a floating black navigation capsule with a central orange-accented action.
- **Typography:** one clean, friendly sans family for the product UI; weight and size carry hierarchy rather than decorative display fonts.
- **Rhythm:** generous vertical spacing, short scan-friendly labels, strong section titles, and dense information only inside a clearly bounded chart/history region.
- **Motion:** subtle state motion only: timer progress, press feedback, task completion, and sheet/modal transitions. Static screenshots cannot establish a reveal language.

## Direction contract

The build's grounded direction is a sun-warmed studio workbench: a physical focus dial is the primary instrument, a folded orange marker shows where the user stopped or is currently working, and index-card-like task/history rows make the surrounding work legible. The visual system stays digital and lightweight rather than imitating paper literally: warm atmosphere is a background layer, white surfaces are the work area, orange is the single signal color, and black navigation is the stable control rail.

The first viewport must prove the mechanism immediately: the user can see the current task, choose a duration, start focus, and understand today's progress without opening another screen. The same grammar must survive the dense Insights chart, the quieter Settings rows, empty states, interrupted sessions, dark mode, and small Android widths. Controls use clear labels and native touch behavior; the workbench metaphor never replaces accessibility text or familiar back navigation.

The signature interaction is the timer ring moving from an open orange arc to a completed loop while the action control changes between Start, Pause, Resume, and End Session. The central navigation action returns to this working surface and opens the same start flow. The honest risk is that a custom floating navigation capsule can feel less native than a stock tab bar, so it must preserve platform back behavior, safe-area insets, screen-reader labels, and at least 48 dp touch targets on Android.

## Screen contracts

### Focus

The first viewport is the working surface: a greeting and local status affordance, an optional task summary, a large focus timer card with an orange progress ring, and an unmistakable start/pause/resume/stop action. The lower summary shows today's focus time, sessions, and goal progress. When no task exists, the user can start an unassigned session without being blocked.

The central navigation action opens the same task-first start flow rather than adding a separate product system. Active timers remain visible and controllable from Focus after navigating elsewhere and returning.

### Tasks

Tasks are a calm, scannable list with an inline completion affordance, task-level focused time/session metadata, start-focus action, and edit/delete actions. Active and completed sections remain easy to distinguish. Creation and editing require only a task name and use an accessible focused sheet/modal.

### Insights

Insights follows the reference's status/progress screen: today's focus and session summary first, then a seven-day orange bar chart, month totals, current/best streak, weekly goal dots, and chronological session history. Tapping a history row opens a detail route where the session can be inspected or deleted. All values are derived from real locally stored sessions.

### Settings

Settings uses the same surface and typography system but prioritizes familiar native controls and grouped rows. Focus duration, daily goal, haptics, completion sound, notifications, theme, accent color, local data deletion, and privacy/about information remain available. No commerce or upgrade surface exists.

## Architecture and data flow

Keep the existing `src/app` route structure and split responsibilities across the existing stores:

- `use-focus-store` owns sessions and timestamp-based active timer state.
- `use-tasks-store` owns task entities.
- `use-settings-store` owns persisted preferences.
- `src/storage` remains the only persistence boundary for AsyncStorage.
- `src/lib` remains the home for pure timer, date, analytics, and streak calculations.

Replace the current shared UI primitives and route layouts with a small tokenized design system: theme tokens, screen shell, surface, button, icon/action button, progress ring, chart primitives, navigation capsule, and accessible sheet/modal patterns. Avoid adding backend-shaped abstractions or commercial flows.

Use Expo Router for route navigation. Preserve the current deep-link path from a task into Focus. Use safe-area insets for content and bottom navigation, platform-appropriate back behavior, and minimum touch targets for all interactive elements.

## Interaction and error behavior

- Empty tasks and empty history teach the next useful action.
- Invalid custom durations/goals are rejected inline with a recovery hint.
- Double start and duplicate completion are guarded by the existing store logic.
- Stopping a running session asks whether to discard or record the interruption.
- Timer restoration recalculates remaining time from persisted timestamps; it never depends on an interval as the source of truth.
- Completion feedback uses haptics/notifications only when enabled and permitted; the in-app completion state always works.
- Destructive deletion requires confirmation and preserves session task-title snapshots when a task is removed.
- Dark mode remains supported as a deliberate alternate surface, not an inverted afterthought.

## Verification contract

Before declaring the redesign complete:

1. Run TypeScript, lint, and the existing pure-logic tests.
2. Search for remote API calls, payment/subscription code, starter/demo UI, and unfinished TODOs.
3. Verify task persistence, session persistence, timer restoration, analytics, streaks, settings, theme changes, notification denial, and offline launch behavior.
4. Run the native build checks available in the workspace and capture at least one Android phone-size render; inspect the Focus, Tasks, Insights, and Settings routes at the shipped device class.
5. Perform one bounded visual QA pass against the supplied reference DNA, fixing material issues in one batch.

## Out of scope

Authentication, backend services, remote APIs, cloud sync, payments, subscriptions, ads, social features, AI, calendar integration, collaboration, projects, and copied reference artwork or photography.
