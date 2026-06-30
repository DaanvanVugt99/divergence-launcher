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
- Apply bundled xdelta patch.
- Verify patched output checksum.
- Store patched ROM under app data.
- Add open-folder and export actions.

## v0.3 mGBA Setup And Launch

- Detect mGBA.
- Let the user manually select mGBA.
- Save selected path.
- Launch mGBA with the patched ROM.
- Handle missing executable and launch failures cleanly.

## v0.4 Packaging

- Package macOS, Windows, and Linux builds.
- Include platform xdelta binaries outside ASAR where needed.
- Add license notices for bundled tools.
- Document install and troubleshooting.

## Future Online Bridge

- Define a small mailbox protocol.
- Add launcher-side service client.
- Add opt-in account/session flow only if needed.
- Add async ghost rival upload/download without making offline gameplay depend on it.
