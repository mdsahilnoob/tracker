# FocusFlow Local Expansion Design

## Goal

Expand FocusFlow into a richer offline productivity companion while preserving its calm four-tab structure, local-only promise, and timestamp-based timer reliability.

## Scope

Add the previously approved features:

- Pomodoro work/break cycles and focus templates
- Recurring tasks, priorities, tags, search, filtering, sorting, and daily planning
- Quick-add task flow and post-session notes
- Local reminders and completion notifications
- Local JSON/CSV export and validated import
- Deeper insights and offline achievements
- A reusable, performance-safe animation system throughout the app

Explicitly excluded:

- Privacy lock
- Home-screen widgets
- Backend, accounts, cloud sync, remote APIs, online analytics, payments, and ads

## Product Shape

The four existing tabs remain the primary navigation:

- Focus: timer mode, templates, today plan, active session, and goal progress
- Tasks: task CRUD, priority/tag/search controls, recurring task controls, and plan selection
- Insights: expanded metrics, trends, session notes, streaks, and achievements
- Settings: timer defaults, reminder controls, data export/import, appearance, and local-only information

## Data Model

Existing v1 entities remain readable. New fields are optional during migration and normalized on load.

`FocusTask` gains `priority`, `tags`, and a recurrence rule. A recurring task stays one entity; its completion dates are stored as local date keys so marking it complete for today does not destroy the recurring task.

`FocusSession` gains optional `notes`, `mode`, and `pomodoroCycle`. Historical task title snapshots remain immutable when a task is edited or deleted.

`ActiveTimerState` gains `mode`, `phase`, `cycle`, `totalCycles`, and break durations. Focus phases create sessions; break phases only advance the Pomodoro state.

New local entities:

- `DailyPlanItem`: date, task reference/title snapshot, planned minutes, and order
- `FocusTemplate`: title, work duration, break duration, long-break duration, and cycle count
- `Reminder`: local time, selected weekdays, optional task reference/title snapshot, and enabled state
- `AchievementUnlock`: achievement id and unlock timestamp

Settings gain Pomodoro defaults, reminder preference, and reduced-motion-compatible animation preference. No derived analytics or streak counters are persisted as authoritative state.

## Storage and Migration

Use a v2 key namespace while retaining v1 readers:

```text
focusflow:v2:sessions
focusflow:v2:tasks
focusflow:v2:settings
focusflow:v2:active-timer
focusflow:v2:daily-plans
focusflow:v2:templates
focusflow:v2:reminders
focusflow:v2:achievements
```

On first v2 load, read valid v1 values, normalize them with defaults, write v2 values, and remove only the successfully migrated v1 key. Invalid v1 values become safe defaults. Import uses the same validators and writes all entities atomically enough for AsyncStorage: parse and validate the complete backup first, then replace entity keys.

## Timer and Reminder Behavior

The timestamp remains the source of truth. A focus phase computes remaining time from `expectedEndAt`; a paused timer stores `pausedAt` and shifts the end timestamp on resume. A break phase follows the same timestamp rules but does not count toward focus analytics. Completion advances the cycle or creates the completed focus session, then schedules/cancels the next local notification as needed.

Local reminders use the operating system scheduler only. Permission denial, Expo Go limitations, malformed reminder data, and notification scheduling errors are all non-fatal; the in-app task and goal views remain usable.

## Animation System

Create small shared primitives around the already-installed Reanimated dependency:

- `AnimatedPressable` for scale feedback
- `AnimatedFadeIn` for screen and card entry
- layout transitions for task and history list changes
- timer pulse and progress-ring transitions
- chart bar growth and goal celebration burst

Animations use short durations, avoid per-second full-tree updates, and disable or reduce motion when the platform reports a reduced-motion preference.

## Verification

Every feature gets pure tests for its data transformation or validation. Required checks after implementation:

- `rtk npm test`
- `rtk npx tsc --noEmit`
- `rtk npm run lint`
- `rtk npx expo export --platform web`
- a repository search confirming no backend/payment/remote API additions

Native Android execution remains dependent on an attached device or emulator.
