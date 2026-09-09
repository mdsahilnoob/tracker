# FocusFlow

FocusFlow is an offline-first Expo SDK 57 focus timer, task list, insights dashboard, and daily goal tracker. All sessions, tasks, settings, and active timer state stay on the device.

## Run locally

```bash
npm install
npx expo start
```

## Verify

```bash
npm test
npx tsc --noEmit
npm run lint
```

## Android release

```bash
eas build --platform android --profile production
```

Before publishing, replace the placeholder Android package ID `com.yourname.focusflow` in `app.json`, replace the starter icon/splash artwork, create or link the EAS project, and verify Play Store listing details and signing credentials.

The app uses versioned AsyncStorage keys under `focusflow:v1:*`. The timer source of truth is persisted timestamps (`startedAt`, `expectedEndAt`, pause metadata); the one-second interval only refreshes the display.
