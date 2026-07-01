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

## Future Online Bridge

- Define a small mailbox protocol.
- Add launcher-side service client.
- Add opt-in account/session flow only if needed.
- Add async ghost rival upload/download without making offline gameplay depend on it.
