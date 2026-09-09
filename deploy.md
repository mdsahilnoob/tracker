# FocusFlow deployment guide

FocusFlow is an Expo SDK 57 Android app. GitHub should host the source code; Google Play should distribute the Android App Bundle. This guide does not run or commit any deployment commands.

## Current project status

- Android application ID: `com.yourname.focusflow` (placeholder — change it before the first Play Store upload).
- Production builds are configured in [`eas.json`](./eas.json) as Android App Bundles (`.aab`) with automatic version-code increments.
- Notifications are temporarily disabled so the app runs in Expo Go on Android.
- App data is local-only and is not uploaded during deployment.

## 1. Prepare the release

Before creating the first store build:

1. Replace `com.yourname.focusflow` in [`app.json`](./app.json) with a permanent reverse-DNS ID, for example `com.acme.focusflow`. The ID must be unique and should not be changed after publishing.
2. Confirm the app name, version, icons, splash artwork, and portrait orientation in `app.json`.
3. Complete the placeholders in [`privacy-policy.md`](./privacy-policy.md), publish it at a public HTTPS URL, and use that URL in Google Play Console.
4. Keep credentials out of GitHub. Never commit keystores, Google service-account JSON files, API tokens, `.env` files, or EAS credentials.

Install dependencies and run the local checks:

```bash
npm ci
npm run test
npx tsc --noEmit
npm run lint
npx expo export --platform android
```

For a fresh Expo Go session after changing configuration:

```bash
npx expo start --clear
```

## 2. Publish the source to GitHub

Create an empty repository on GitHub, then run these commands from the project root. Replace the URL with the repository you created.

```bash
git init
git branch -M main
git remote add origin https://github.com/OWNER/REPOSITORY.git
git add .
git commit -m "Initial FocusFlow release"
git push -u origin main
```

Confirm that the repository does not contain secrets before pushing:

```bash
git status --short
git ls-files -- '*.jks' '*.keystore' '*service-account*' '*credentials*' '.env*'
```

The project `.gitignore` already excludes common native signing and local environment files. If a secret was ever committed, revoke it and rotate it; deleting the file in a later commit is not enough.

GitHub reference: <https://docs.github.com/en/get-started/quickstart/create-a-repo>.

## 3. Configure Expo Application Services

EAS Build creates the signed Android App Bundle in the cloud.

```bash
npm install --global eas-cli
eas login
eas whoami
eas init
```

Run `eas init` once for this project. It links the local project to an Expo project and adds the EAS project ID to the Expo configuration. Do not manually invent or commit signing credentials.

If EAS asks to configure build profiles, keep the existing `eas.json` profiles and verify that the production profile contains:

```json
{
  "android": {
    "buildType": "app-bundle"
  },
  "autoIncrement": true
}
```

Expo EAS reference: <https://docs.expo.dev/build/introduction/>.

## 4. Build and test an Android release

Create an internal preview build first:

```bash
eas build --platform android --profile preview
```

Install the generated artifact on a physical Android device and test:

- first launch and splash-screen exit
- focus timer start, pause, resume, completion, and interruption
- task creation, editing, completion, and deletion
- insights, streaks, daily goal, and history
- light/dark theme and settings persistence
- app restart while a timer is active
- offline operation

Create the Play Store production App Bundle:

```bash
eas build --platform android --profile production
```

On the first production build, allow EAS to generate and securely store the Android keystore. Keep access to the Expo account that owns the project. Losing the signing key can prevent future updates to the same Play Store application.

Check build status and download artifacts with:

```bash
eas build:list --platform android
eas build:view BUILD_ID
```

EAS Build reference: <https://docs.expo.dev/build/setup/>.

## 5. Create the Google Play application

In Google Play Console:

1. Create a developer account if needed.
2. Create a new application.
3. Select the default language, app name, and **App** type.
4. Use the exact Android application ID from `app.json`.
5. Complete the store listing, app icon, feature graphic, screenshots, category, contact email, privacy-policy URL, content rating, target audience, ads declaration, and Data safety form.
6. Start with **Internal testing** and add tester accounts.

The first Play Store release should go to Internal testing. Testers can install it before the release is promoted to closed testing or production.

Google Play release reference: <https://support.google.com/googleplay/android-developer/answer/9859152>.

## 6. Submit the App Bundle to Google Play

The first automated submission needs Google Play API access:

1. In Google Cloud, enable the Google Play Android Developer API.
2. Create a service account and download its JSON key temporarily.
3. In Play Console, invite the service-account email under **Users and permissions** and grant the release permissions required for the target track.
4. Add the service-account key through EAS credentials or the EAS dashboard. Do not place the JSON key in this repository.

Submit the latest production build:

```bash
eas submit --platform android --latest
```

For the first submission, select the **internal** track when prompted. After the upload appears in Play Console, finish the release review and roll it out to internal testers. Promote the tested release to production from Play Console when ready.

EAS Submit reference: <https://docs.expo.dev/submit/android/>.

## 7. Subsequent releases

For every release:

1. Make and test code changes on a branch.
2. Update the user-facing `version` in `app.json` when appropriate. The production EAS profile automatically increments the Android `versionCode`.
3. Run the local checks from section 1.
4. Push the reviewed changes to GitHub.
5. Build a new production bundle.
6. Submit it to the internal track first.
7. Test it, then promote the release in Play Console.

```bash
eas build --platform android --profile production
eas submit --platform android --latest
```

Never reuse an old `.aab` after changing the source. Each Play Store update must have a higher Android version code.

## Optional GitHub Actions build

To build on pushes to `main` or release tags, add a GitHub Actions workflow such as `.github/workflows/android.yml`:

```yaml
name: Android build

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx eas-cli@latest build --platform android --profile production --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

Create `EXPO_TOKEN` from the Expo account and store it only as a GitHub Actions secret. Configure EAS credentials in advance so the workflow never needs an interactive prompt. Keep production submission as a separate approval step until the internal release has been tested.

## Troubleshooting

### Expo Go still shows an old route or splash error

Stop the server and clear Metro's cache:

```bash
npx expo start --clear
```

Then reload Expo Go. The current project does not import `expo-notifications`, so route discovery should not throw the former Android Expo Go notification error.

### The phone cannot connect to the development server

Make sure the computer and phone are on the same network, then try:

```bash
npx expo start --lan
```

If the network blocks LAN discovery, use:

```bash
npx expo start --tunnel
```

### EAS rejects the Android package

Make sure `android.package` is a permanent, unique ID and that the same ID is used by the Play Console application. Do not change it after the first store upload.

### Play Console rejects an update

Check that the new bundle has a higher `versionCode`, uses the same signing credentials, targets the required Android API level, and has all Play Console declarations completed.

### Notifications are needed later

Notifications are intentionally disabled for the current Expo Go-compatible build. Reintroduce them only after switching notification testing to an Expo development build, following the SDK 57 notification documentation: <https://docs.expo.dev/versions/v57.0.0/sdk/notifications/>.
