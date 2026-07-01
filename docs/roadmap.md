# Roadmap

## v0.1 Local Launcher Shell

- Electron app shell.
- TypeScript config.
- React renderer.
- shadcn/ui-style components with Tailwind CSS.
- Secure preload bridge placeholder.
- Placeholder screens for ROM selection, patch status, mGBA setup, and play.
- Architecture, legal, and roadmap docs.

## v0.2 ROM Verification And Patching

- Select source ROM.
- Compute checksum.
- Validate approved base ROM checksum.
- Apply local xdelta patch.
- Verify patched output checksum.
- Store patched ROM under app data.
- Add open-folder and export actions.

## v0.3 mGBA Setup And Launch

- Detect mGBA.
- Let the user manually select mGBA.
- Save selected path.
- Launch externally installed mGBA with the verified patched ROM.
- Handle missing executable and launch failures cleanly.

## v0.4 Packaging

- Package unsigned macOS development builds first.
- Include the matching xdelta native runtime support outside ASAR.
- Add license notices for bundled tools.
- Document release checks, unsigned macOS behavior, and future CI needs.
- Add Windows and Linux release jobs later through a platform CI matrix.

## v0.5 Release Hardening

- Add GitHub Actions CI for macOS arm64 release artifacts.
- Produce macOS ZIP artifacts from CI.
- Verify packaged artifact contents, bundle id, icon, patch, xdelta runtime, and license notice.
- Document macOS signing and notarization requirements.
- Move debug reset into an About/settings dialog instead of keeping it in the top bar.

## v0.6 Release Polish

- Add a changelog.
- Add tag-triggered GitHub Release publishing for macOS ZIP artifacts.
- Add explicit CI permissions and concurrency.
- Add optional Apple Developer ID signing and notarization in CI.
- Verify signed artifacts with `codesign` and notarized artifacts with `stapler`.
- Keep unsigned local development builds working when Apple credentials are absent.

### Deferred TODO

- Enroll a personal Apple Developer account and configure signing/notarization
  secrets before public macOS distribution.

## v0.7 Cross-Platform Release Support

- Add Windows x64 release packaging.
- Build macOS arm64 and Windows x64 artifacts in GitHub Actions.
- Verify Windows artifacts include the app, patch, xdelta runtime, and license notice.
- Publish both platform ZIPs from one tag-triggered GitHub Release job.
- Keep Linux as a later target until its packaging and emulator expectations are tested.

## Future Online Bridge

- Define a small mailbox protocol.
- Add launcher-side service client.
- Add opt-in account/session flow only if needed.
- Add async ghost rival upload/download without making offline gameplay depend on it.
