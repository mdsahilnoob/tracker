# Lucide icon migration design

## Goal

Replace the app's current `expo-symbols` icon renderer with `lucide-react-native` while preserving the existing icon call sites, sizes, colors, accessibility labels, and layout.

## Current state

- All rendered icons are routed through `src/components/ui/icon.tsx`.
- Call sites pass platform-specific names as `{ ios, android, web }` objects.
- `Icon` currently renders `SymbolView` from `expo-symbols`.
- `react-native-svg` is already installed at `15.15.4`; `lucide-react-native` is not installed.

## Chosen approach

Keep `Icon` as the compatibility boundary and replace only its renderer. A centralized Lucide registry will translate every existing platform-specific name to a Lucide component. This avoids changing every screen and keeps future icon changes in one place.

The registry will cover the existing icon vocabulary, including timers, navigation, search, add/remove, check states, reminders, editing/deleting, charts, stars, calendar actions, and chevrons. iOS, Android, and web aliases that represent the same action will resolve to the same Lucide icon. Filled system variants will use Lucide's supported `fill` prop where it preserves the existing emphasis; otherwise they will use the matching Lucide outline icon.

Unknown names will render a neutral fallback icon instead of throwing, so a missed mapping cannot break a screen. The wrapper will continue to pass `size`, `color`, and accessibility labels through to the Lucide component.

## Files and dependency changes

- Add `lucide-react-native` to `package.json` and `package-lock.json`.
- Update `src/components/ui/icon.tsx` to use Lucide components and the centralized registry.
- Keep existing screen-level icon call sites unchanged unless TypeScript requires a small type adjustment.
- Remove the `expo-symbols` dependency only if no other source file uses it after the migration; otherwise leave it installed but unused.

## Verification

- Run TypeScript checking.
- Run the existing unit test suite.
- Run the icon-name search to confirm all rendered icons still route through the shared wrapper and no direct `SymbolView` usage remains.
- Run the UI layout detector on representative screens.
- Do not run an Expo/EAS app build, per the user's instruction.

## Non-goals

- No changes to icon placement, touch targets, colors, typography, navigation, or app behavior.
- No migration of non-icon SVG graphics such as the timer ring.
- No redesign of the icon set beyond using Lucide equivalents.
