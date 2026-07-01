# Release Checklist

v0.4 supports a macOS-first unsigned development package. The launcher is not
ready for a public signed/notarized release yet.

## Local macOS Build

Use Node 22 or newer, then run:

```sh
npm install
npm run release:check
npm run make:mac
```

The generated app and ZIP are written under `out/`.

## Manual Smoke Test

Before sharing a development build:

1. Open the packaged app from `out/`.
2. Reset launcher data with the debug reset action.
3. Select a clean Pokemon Emerald ROM.
4. Verify the source ROM.
5. Apply the Divergence patch.
6. Confirm the managed patched ROM verifies as ready.
7. Configure or detect mGBA.
8. Launch mGBA from the Play tab.
9. Export the patched ROM and confirm the exported file exists.

## Unsigned macOS Builds

Current builds are unsigned. macOS Gatekeeper may warn when opening a ZIP or app
shared outside this machine. Public release builds should add Developer ID
signing and notarization before distribution.

## Platform Notes

The xdelta runtime is a native Node addon. The local packaging script copies the
addon for the OS and CPU architecture doing the packaging. That means:

- Apple Silicon macOS builds include the `darwin-arm64` addon.
- Intel macOS builds need to be made on `darwin-x64` or by CI that installs that
  target dependency.
- Windows builds need a Windows packaging job.
- Linux builds need a Linux packaging job once Linux support is promoted.

Future release CI should use a platform matrix and run the same smoke checks on
each generated artifact.

## Distribution Rules

Release artifacts may include:

- The launcher application.
- The Divergence xdelta patch.
- Third-party license notices for bundled runtime dependencies.

Release artifacts must not include:

- A base Pokemon Emerald ROM.
- A full pre-patched ROM.
- User save files or local launcher state.
