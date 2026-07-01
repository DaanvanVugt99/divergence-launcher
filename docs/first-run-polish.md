# v0.8 First-Run Polish

## Goal

Make the local launcher flow feel clear and testable before adding online
features. A new user should understand the next required action from the Play
tab, while testers should have a simple way to copy non-sensitive diagnostics.

## Scope

- Keep the launcher centered on the local flow: source ROM, patch, mGBA, play.
- Add a direct next-step prompt on the Play tab when setup is incomplete.
- Keep technical details behind disclosure controls or settings.
- Add a copy diagnostics action for support reports.
- Keep debug reset in About/settings for development builds.

## Out Of Scope

- Online accounts, ghost rivals, or service integration.
- Save-file management.
- mGBA bundling.
- Auto-updates.
- A full settings section beyond the current About/settings dialog.

## Acceptance Checklist

- Fresh install shows a clear next action from the Play tab.
- ROM selected but unverified routes the user back to ROM setup, not patching.
- Patched-but-no-mGBA state routes the user to mGBA setup.
- Ready state keeps launch, export, and folder actions visible.
- Diagnostics can be copied without including the selected source ROM path.
- Typecheck and unit tests pass.
