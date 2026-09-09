You are a senior Expo + React Native engineer and mobile product designer.

Build a complete, production-ready Android focus tracker app that can be published on the Google Play Store.

IMPORTANT PROJECT CONTEXT:

* This is an existing React Native project built with the Expo framework.
* I have already created the initial Expo starter app.
* Work directly on top of the existing project.
* Do NOT create a new Expo project.
* Do NOT run `create-expo-app`.
* Do NOT replace the existing repository with a fresh template.
* Do NOT delete existing Expo configuration unless it is genuinely incorrect and needs modification.
* Inspect the current project first and adapt your implementation to the existing Expo SDK, package manager, TypeScript configuration, routing setup, and folder structure.
* Preserve existing working configuration where possible.
* If Expo Router is already configured, use it.
* If the starter project uses a compatible existing navigation structure, adapt it rather than rebuilding unnecessarily.
* Add only the dependencies required for this application.
* Use Expo-compatible libraries whenever possible.
* Avoid ejecting from Expo unless there is an unavoidable technical requirement.
* The final app should remain an Expo-managed React Native application.

The app should be simple, fast, polished, privacy-friendly, fully offline, and have exactly four major V1 features.

# PRODUCT

Working name: FocusFlow

Purpose:

Help users focus on tasks, track focused work sessions, maintain daily focus goals, and understand their productivity without requiring an account or internet connection.

This is a V1 product.

Do NOT overengineer it.

The app must:

* work fully offline
* require no account
* require no authentication
* have no backend
* use no remote database
* collect no personal data
* work without internet after installation
* store all user data locally on the device
* be suitable for publishing to Google Play
* have a polished modern UI
* support Android first
* use TypeScript
* remain compatible with Expo

---

# EXISTING PROJECT RULES

Before writing implementation code:

1. Inspect the existing Expo starter project.
2. Read `package.json`.
3. Determine the installed Expo SDK version.
4. Determine whether Expo Router is already installed/configured.
5. Inspect the existing `app/` or `src/` structure.
6. Inspect `app.json`, `app.config.js`, or `app.config.ts`.
7. Inspect `tsconfig.json`.
8. Determine the current package manager from the lockfile.
9. Reuse existing dependencies where appropriate.
10. Do not downgrade Expo or React Native unless absolutely necessary.

When installing packages, use versions compatible with the currently installed Expo SDK.

Prefer:

`npx expo install <package>`

for Expo-supported dependencies rather than manually installing arbitrary versions.

Do NOT reinitialize the repository.

Do NOT create a nested Expo project inside the current project.

The existing repository root is the application root.

---

# TECH STACK

Use the existing Expo React Native project.

Preferred stack:

* Expo
* React Native
* TypeScript
* Expo Router
* Zustand
* AsyncStorage
* React Native Reanimated
* Expo Haptics
* Expo Notifications
* Expo Audio or an Expo-compatible audio solution if necessary
* React Native Safe Area Context
* Lucide React Native

Use Expo-compatible APIs wherever possible.

Avoid unnecessary dependencies.

Do not use:

* Firebase
* Supabase
* MongoDB
* PostgreSQL
* remote APIs
* analytics SDKs
* advertising SDKs
* user accounts
* cloud syncing

The application must remain usable in airplane mode.

---

# DESIGN DIRECTION

Build a premium minimal productivity interface inspired by:

* Linear
* Raycast
* Things
* Forest
* Apple Screen Time

Do NOT directly copy any existing application.

Design characteristics:

* minimal
* modern
* spacious
* distraction-free
* smooth
* subtle borders
* rounded cards
* strong typography hierarchy
* excellent dark mode
* excellent light mode
* large touch targets
* clean iconography

Avoid:

* excessive gradients
* excessive shadows
* overly colorful UI
* childish gamification
* unnecessary illustrations
* cluttered dashboards

Use a neutral palette with one configurable accent color.

---

# APP NAVIGATION

Use a bottom tab navigation system with:

1. Focus
2. Tasks
3. Insights
4. Settings

If Expo Router is already configured, implement this using Expo Router route groups and tabs.

Preferred structure:

app/
_layout.tsx

(tabs)/
_layout.tsx
index.tsx
tasks.tsx
insights.tsx
settings.tsx

task/
[id].tsx

session/
[id].tsx

The Focus page should be the default tab.

Do not restructure the existing project unnecessarily if an equivalent structure already exists.

---

# V1 FEATURE 1 — FOCUS TIMER

Create a complete focus timer.

Default focus time:

25 minutes

Preset options:

* 15 min
* 25 min
* 45 min
* 60 min

Allow custom focus duration between:

1 and 180 minutes.

The timer screen should show:

* large countdown
* current task
* circular progress
* Pause
* Resume
* Stop
* End Session

Before starting a session, allow the user to optionally associate a task.

Example:

Focus

Task
Finish React Native project

24:32

[circular progress]

Pause

End Session

When the timer reaches zero:

* trigger a local Expo notification when appropriate
* play an optional local completion sound
* trigger haptic feedback
* save the focus session locally
* update daily statistics
* update streak calculations

If the user stops early:

show a confirmation dialog:

End this focus session?

Cancel
End Session

Allow interrupted sessions to optionally be recorded.

---

# IMPORTANT TIMER ARCHITECTURE

The timer must remain correct when:

* the user navigates around the app
* the app enters the background
* the phone screen locks
* the app is temporarily suspended
* the user returns after several minutes
* the date changes during a session

Do NOT rely exclusively on:

`setInterval(() => remainingSeconds--, 1000)`

as the source of truth.

Use timestamps.

Store timer state such as:

* startedAt
* expectedEndAt
* plannedDuration
* pausedAt
* accumulatedPausedMilliseconds
* timerStatus
* selectedTaskId

Calculate the current remaining duration from timestamps.

Use a display interval only to refresh the UI.

The timestamp state remains the source of truth.

Persist active timer state locally so an unfinished timer can be restored after the app process is recreated.

Avoid writing AsyncStorage every second.

---

# V1 FEATURE 2 — TASKS

Create a lightweight focus-oriented task manager.

Users can:

* create tasks
* edit tasks
* delete tasks
* mark tasks completed
* restore completed tasks
* select a task before a focus session
* start focus directly from a task

A task contains:

id
title
createdAt
completedAt
isCompleted

Task-specific productivity statistics should be calculated from focus sessions.

Show:

Focus time

Example:

1h 35m

Sessions

4

Task creation should require only:

Task name

Do NOT add:

* projects
* teams
* collaboration
* comments
* file attachments
* complex priorities
* kanban
* complicated deadlines

Keep the feature lightweight.

Sections:

Active

Completed

Historical focus sessions should remain readable even if their original task gets deleted.

Store an optional task title snapshot inside a focus session.

---

# V1 FEATURE 3 — FOCUS INSIGHTS

Create a completely local productivity analytics dashboard.

All statistics must be computed from stored focus sessions.

## Today

Show:

Focus time

Example:

2h 35m

Sessions

6

Daily goal

120 / 180 min

## Last 7 Days

Show a simple visual chart of focus minutes per day.

Example:

Mon ████
Tue ███████
Wed ██
Thu █████
Fri ████████
Sat ███
Sun █████

Use an Expo-compatible chart implementation or create a lightweight chart using regular React Native views if that keeps dependencies simpler.

Show:

* total focus time
* average focus time per active day
* session count
* longest session

## This Month

Show:

* total focus hours
* total sessions
* active focus days

## Session History

Show chronological history.

Example:

Today

Finish React Native app
45 min
10:30 AM

Study algorithms
25 min
8:12 AM

Yesterday

Read documentation
60 min
6:30 PM

Users can tap a session to inspect:

* task
* date
* start time
* duration
* planned duration
* status

Status:

* completed
* interrupted

Allow incorrect sessions to be deleted.

Recalculate statistics automatically when a session is removed.

Do not use remote analytics.

---

# V1 FEATURE 4 — DAILY GOALS AND STREAKS

Allow users to define a daily focus goal.

Default:

120 minutes

Presets:

30
60
90
120
180
240

Also support a custom goal.

Display:

Today's Goal

85 / 120 min

████████░░░░

71%

When the user completes the daily goal:

show a tasteful lightweight celebration.

No excessive confetti.

Track:

* current streak
* longest streak
* daily goal completion
* focus days

Definition:

A streak day counts when the user reaches the configured daily focus goal.

Example:

7 day streak

Include a weekly visualization:

M T W T F S S
● ● ● ● ● ○ ○

Use the device's current local timezone.

Handle correctly:

* midnight
* month boundaries
* year boundaries
* timezone changes
* daylight-saving changes where applicable

Do not store a duplicated streak counter as the sole source of truth if it can be derived from history.

---

# SETTINGS

Create a Settings page.

## Focus

Default focus duration

Default:
25 minutes

Daily focus goal

Default:
120 minutes

## Timer

Completion sound:
On / Off

Haptic feedback:
On / Off

Notifications:
On / Off

## Appearance

Theme:

* System
* Light
* Dark

Accent color:

provide a small curated selection.

## Data

Show number of stored sessions.

Example:

124 sessions stored locally

Add:

Delete all focus data

This must require destructive confirmation.

Dialog:

Delete all focus data?

This permanently removes your tasks, sessions, settings-related productivity history, and streak information stored on this device.

Cancel
Delete Everything

## About

Display:

* app name
* version
* Expo/React Native application information if useful
* privacy message

Privacy message:

"Your focus data stays on your device. FocusFlow does not require an account and does not upload your productivity data."

---

# DATA MODELS

Use strongly typed TypeScript models.

Example:

interface FocusSession {
id: string;
taskId?: string;
taskTitle?: string;

startedAt: string;
endedAt: string;

plannedDurationMinutes: number;
actualDurationMinutes: number;

status: "completed" | "interrupted";
}

interface FocusTask {
id: string;
title: string;

createdAt: string;
completedAt?: string;

isCompleted: boolean;
}

interface UserSettings {
defaultFocusMinutes: number;
dailyGoalMinutes: number;

theme: "system" | "light" | "dark";

soundEnabled: boolean;
hapticsEnabled: boolean;
notificationsEnabled: boolean;

accentColor: string;
}

interface ActiveTimerState {
sessionId: string;
taskId?: string;
taskTitle?: string;

startedAt: string;
expectedEndAt: string;

plannedDurationMinutes: number;

pausedAt?: string;
accumulatedPausedMilliseconds: number;

status: "running" | "paused";
}

Adjust interfaces when needed, but maintain strong typing.

---

# LOCAL STORAGE

Use AsyncStorage or another Expo-compatible local persistence library if one is already appropriately installed.

Prefer AsyncStorage for this V1 unless the existing project already uses another suitable local persistence solution.

Create a storage abstraction.

Example:

src/
storage/
index.ts
sessions.ts
tasks.ts
settings.ts
activeTimer.ts

Do not make direct AsyncStorage calls throughout components.

Use versioned keys.

Example:

focusflow:v1:sessions
focusflow:v1:tasks
focusflow:v1:settings
focusflow:v1:active-timer

Handle invalid or corrupted JSON safely.

Use defaults rather than crashing.

Create the architecture so future local-data migrations can be added.

Do not introduce SQLite unless there is a genuine reason.

For V1, AsyncStorage is sufficient.

---

# STATE MANAGEMENT

Use Zustand for app-level client state unless the existing project already has a sensible equivalent.

Potential stores:

useFocusStore
useTasksStore
useSettingsStore

Avoid putting all application logic into a single enormous store.

Separate:

* UI state
* persisted entities
* derived analytics

Do not persist every derived value.

---

# ANALYTICS LOGIC

Create pure utility functions.

For example:

src/lib/analytics.ts

Functions could include:

getFocusMinutesForDate()
getTodayStats()
getLast7Days()
getMonthlyStats()
getTaskStats()
getLongestSession()
getActiveDays()

Create:

src/lib/streaks.ts

Functions could include:

calculateCurrentStreak()
calculateLongestStreak()
didMeetGoalOnDate()

Create:

src/lib/dates.ts

Centralize local-date logic.

Avoid scattering difficult date calculations across React components.

---

# UI COMPONENTS

Create reusable UI primitives.

Example:

components/
ui/
Button.tsx
Card.tsx
Screen.tsx
SectionHeader.tsx
ProgressBar.tsx
EmptyState.tsx
ConfirmDialog.tsx

focus/
FocusTimer.tsx
TimerRing.tsx
DurationPicker.tsx
TaskSelector.tsx

tasks/
TaskCard.tsx
TaskForm.tsx

insights/
DailySummary.tsx
WeeklyChart.tsx
GoalProgress.tsx
SessionHistory.tsx

Do not create unnecessary abstraction for one-line components.

---

# FOCUS SCREEN

Make the Focus tab the best-designed part of the application.

Example layout:

Good morning

Ready to focus?

25:00

[circular timer]

Task
Finish mobile app

[ Start Focus ]

Today

1h 35m       4 sessions

95 / 120 min

██████████░░

5 day streak

Keep visual hierarchy strong.

Timer should be the primary focal point.

---

# EMPTY STATES

Create polished empty states.

Tasks:

No tasks yet

Create your first task and start focusing on what matters.

[ Create Task ]

Insights:

No focus sessions yet

Complete your first focus session to see your productivity insights.

[ Start Focus ]

History:

No sessions recorded yet.

---

# MICROINTERACTIONS

Use Expo-compatible animations.

Possible tools:

* React Native Reanimated
* LayoutAnimation
* Animated

Use subtle animations for:

* starting timer
* pausing
* resuming
* timer completion
* adding a task
* completing a task
* daily goal completion
* progress updates

Animations should not interfere with performance.

---

# HAPTICS

Use Expo Haptics for:

* starting session
* pausing
* resuming
* completing task
* timer ending
* reaching daily goal

Respect the user's haptics setting.

Do not trigger excessive haptic feedback.

---

# LOCAL NOTIFICATIONS

Use Expo Notifications.

Only local notifications.

No push notification server.

When a focus timer completes in the background, show something like:

Focus session complete

Great work — you focused for 25 minutes.

Request notification permission only when required.

If permission is denied:

* timer must still work
* app must not crash
* show completion inside the app when reopened

Schedule or cancel local timer notifications appropriately when:

* session starts
* timer is paused
* timer resumes
* session is stopped
* timer finishes

Do not leave stale notifications scheduled.

---

# OFFLINE REQUIREMENTS

The complete application must work with:

Airplane mode ON.

These features must still work:

* app launch
* task creation
* task editing
* task deletion
* timer
* timer restoration
* session completion
* session history
* analytics
* goals
* streaks
* appearance
* settings
* local notifications where OS behavior permits

No application feature should wait for network connectivity.

Search the codebase for accidental remote network dependencies before completion.

---

# PLAY STORE READINESS

Because this application will be released to Google Play, configure the existing Expo project appropriately.

Inspect the existing Expo configuration first.

Update the existing:

app.json

or:

app.config.ts / app.config.js

rather than replacing it unnecessarily.

Configure:

* app name
* Android package ID
* version
* Android versionCode
* portrait orientation if appropriate
* app icon
* Android adaptive icon
* splash screen
* theme colors
* notification icon if required
* deep Expo configuration needed by dependencies

Use a package identifier in a standard reverse-domain format.

If no final package ID has been provided, use a clearly documented placeholder such as:

com.yourname.focusflow

Make it easy to change before release.

Do not request permissions unrelated to functionality.

Avoid permissions for:

* camera
* microphone
* contacts
* precise location
* call logs
* broad file storage

Configure only permissions actually required by Expo modules used.

---

# EAS BUILD

Prepare the existing project for EAS Build.

If `eas.json` does not exist, create it.

Provide profiles appropriate for:

development
preview
production

Production should generate the format needed for Google Play distribution.

Do not run destructive account-specific EAS operations if credentials are unavailable.

Configure the repository itself so that I can later run:

npm install

npx expo start

and:

eas build --platform android --profile production

If the current project uses pnpm or yarn, preserve that package manager instead.

Do not silently switch package managers.

---

# PERFORMANCE

The app should:

* launch quickly
* remain smooth on mid-range Android devices
* avoid unnecessary rerenders
* avoid writing storage every second
* support thousands of historical sessions
* avoid unnecessarily heavy charting libraries
* avoid unnecessary dependencies

Use derived state appropriately.

---

# ACCESSIBILITY

Include:

* readable font sizes
* proper contrast
* accessible button labels
* large enough touch targets
* screen reader labels for icon-only buttons
* support for different Android screen sizes

Do not communicate state using color alone.

---

# EDGE CASES

Handle carefully:

* app starts with empty storage
* malformed storage
* active timer exists when app launches
* app closes during running timer
* app closes during paused timer
* timer finishes in background
* timer crosses midnight
* user changes daily goal
* user deletes associated task
* user deletes historical session
* user changes system theme
* notification permission denied
* custom focus duration invalid
* task name empty
* very long task name
* double tapping Start
* rapidly pressing Pause / Resume
* completing the same timer twice
* restoring completed tasks
* device time changing

Prevent duplicate session creation.

---

# TESTING

Write unit tests for pure logic.

Prioritize:

timer.ts
analytics.ts
streaks.ts
dates.ts

Test:

* today totals
* last-seven-day aggregation
* monthly aggregation
* longest session
* completed session
* interrupted session
* current streak
* longest streak
* zero streak
* midnight handling
* goal completion
* task-specific focus statistics
* timer remaining calculation

Do not add unnecessary UI testing infrastructure for V1 unless already configured.

---

# DEVELOPMENT RULES

1. Build inside the existing Expo starter project.

2. Do not initialize another project.

3. Do not create a nested `focusflow/` project.

4. Do not overwrite existing config blindly.

5. Inspect before modifying.

6. Use the current Expo SDK.

7. Prefer `npx expo install` for Expo-related packages.

8. Preserve the existing package manager.

9. Use TypeScript.

10. Do not add a backend.

11. Do not add APIs.

12. Do not create fake UI.

13. Every visible interactive element must work.

14. Do not leave unfinished TODOs for core features.

15. Do not hardcode fake analytics.

16. Do not add unnecessary V2 features.

17. Keep code modular and readable.

18. Do not eject Expo without a genuine unavoidable requirement.

19. Prefer Expo-managed solutions.

20. Ensure existing starter functionality is safely transformed into the final application.

---

# V1 FEATURE SCOPE

The four major features are exactly:

1. Focus Timer
2. Focus Tasks
3. Focus Insights and Session History
4. Daily Goals and Streaks

Settings, themes, notifications, and navigation support these features.

Do not turn them into additional major product systems.

DO NOT ADD:

* authentication
* cloud sync
* Firebase
* Supabase
* AI
* chat
* social features
* leaderboards
* teams
* subscriptions
* payment systems
* ads
* online profiles
* complex project management
* calendar integrations
* web dashboard

---

# IMPLEMENTATION ORDER

Work directly inside the existing repository.

Recommended order:

1. inspect current Expo project
2. identify existing SDK/config/navigation
3. clean unnecessary starter/demo UI without destroying config
4. establish theme system
5. establish reusable UI components
6. implement local storage abstraction
7. implement task system
8. implement timer state architecture
9. implement timer UI
10. implement background/restoration behavior
11. implement local notifications
12. implement session persistence
13. implement analytics
14. implement goals
15. implement streak calculations
16. build Insights UI
17. build Settings
18. polish animations/haptics
19. handle empty/error states
20. add tests
21. configure Android app metadata
22. configure EAS
23. verify production readiness

---

# VERIFICATION

Before saying the implementation is complete, inspect and verify the project.

Run the appropriate commands supported by the existing repository.

At minimum, where configured:

TypeScript:

npx tsc --noEmit

Lint:

npm run lint

or the equivalent package-manager command.

Tests:

npm test

or the configured test command.

Expo:

npx expo-doctor

Start validation:

npx expo start

Do not claim a command passed unless it actually passed.

Fix implementation-related errors before completion.

Also search the project for:

* unused starter demo screens
* fake data
* accidental API requests
* unfinished TODOs
* hardcoded analytics
* duplicated storage logic
* unnecessary permissions

---

# FINAL REVIEW

Before declaring the app complete, verify:

* it is still an Expo project
* the existing project was modified rather than recreated
* no second Expo app was nested inside it
* all four features work
* all major buttons are functional
* task data persists
* sessions persist
* active timer can recover
* analytics derive from real sessions
* streaks calculate correctly
* settings persist
* theme persists
* notification denial does not crash the app
* offline mode works
* no backend exists
* no remote API dependency exists
* Android configuration is valid
* EAS configuration is ready
* TypeScript errors are resolved
* lint errors introduced by this work are resolved
* tests pass where configured

---

# FINAL RESPONSE

When implementation is finished, give me a concise report containing:

1. What you changed in the existing Expo starter project
2. The four completed V1 features
3. Final project structure
4. Dependencies installed
5. Local storage design
6. Timer architecture
7. How background timer restoration works
8. How local notifications work
9. Commands to run the app
10. Commands to test the app
11. EAS Android production build command
12. What I need to change before Play Store submission
13. Any remaining limitations

The goal is a small but genuinely complete Play Store-quality V1.

Do not build a prototype.

Build a finished Expo React Native application on top of my existing Expo starter project.
