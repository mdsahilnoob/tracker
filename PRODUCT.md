# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Stack

Existing Expo SDK 57, React Native, TypeScript, Expo Router, Zustand, and AsyncStorage project. Android is the first release target, with the existing Expo iOS surface preserved.

## Users

People who want a calm, private way to focus on their own work from a phone, especially during short planned focus sessions.

## Product Purpose

FocusFlow helps users focus on tasks, record focused work sessions, maintain daily focus goals, and understand their productivity without an account or internet connection.

## Positioning

FocusFlow is deliberately local-first: focus history, tasks, goals, and streaks stay on the device and are calculated from the user's own sessions. It is a free utility with no subscriptions, payments, advertisements, or cloud account.

## Operating Context

Users open the app to begin a timed focus session, optionally attach it to a task, pause or end the session, and return later to review daily, weekly, monthly, and streak progress. The app must remain useful in airplane mode and after the process is suspended or recreated.

## Capabilities and Constraints

- Four V1 product features: focus timer, lightweight tasks, focus insights with session history, and daily goals with streaks.
- Task actions: create, edit, delete, complete, restore, select for focus, and start focus from a task.
- Timer durations: 15, 25, 45, and 60 minute presets, with custom focus durations from 1 to 180 minutes.
- Daily goal presets: 30, 60, 90, 120, 180, and 240 minutes, with custom values from 1 to 1,440 minutes.
- Timer state is timestamp-based and persisted locally so it can recover after backgrounding, locking, suspension, or process recreation.
- Session analytics and streaks are derived from stored sessions using the device's local timezone.
- Local notifications and haptics may be used where the operating system permits, but denied notification permission must never break the timer.
- No backend, remote API, authentication, cloud sync, payment system, subscription, advertisement, or online analytics.

## Brand Commitments

- Product name: FocusFlow.
- Free, privacy-friendly, offline by design.
- The supplied app design image is the visual reference for the redesign. Its pricing and lifetime-access content is not product truth and must not be implemented.

## Evidence on Hand

- Product requirements and implementation constraints: `task.md`.
- Visual reference supplied by the user: `C:\Users\KIIT0001\Downloads\app_design.webp`.
- Existing local storage, timer, analytics, and route implementations in `src/`.
- No customer testimonials, commercial pricing, remote data, or user-provided photography should be fabricated.

## Product Principles

1. Make starting a focus session feel immediate.
2. Keep the user's productivity history private and recoverable.
3. Turn raw sessions into clear, useful progress signals.
4. Keep the task model lightweight enough to maintain.
5. Treat interruption and empty history as normal states, not failures.

## Accessibility & Inclusion

Use readable type, strong contrast, screen-reader labels for icon-only actions, touch targets of at least 44 points / 48 dp where platform guidance requires it, and layouts that remain usable on smaller Android screens and larger text settings. Never communicate important state through color alone.
