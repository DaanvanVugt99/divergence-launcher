# Release Checklist

v0.7 supports macOS arm64 and Windows x64 release artifacts, optional Apple
Developer ID signing and notarization for macOS, and tag-triggered GitHub
Releases.

## Local macOS Build

Use Node 22 or newer, then run:

```sh
npm install
npm run release:mac
```

The generated app and ZIP are written under `out/`.

`release:mac` runs the TypeScript check, unit tests, macOS app packaging,
deterministic ZIP creation with `ditto`, and the artifact verifier.

## Local Windows Build

Run this on Windows with Node 22 or newer:

```sh
npm install
npm run release:win
```

The generated app and ZIP are written under `out/`.

`release:win` runs the TypeScript check, unit tests, Windows app packaging,
ZIP creation with PowerShell `Compress-Archive`, and the Windows artifact
verifier.

## CI Checks

GitHub Actions runs the cheap CI workflow on pull requests, pushes to `main`,
and manual workflow dispatches. This workflow installs dependencies, typechecks,
and runs unit tests.

## Release Build

GitHub Actions builds macOS arm64 and Windows x64 ZIPs only when a tag matching
`v*` is pushed, or when the release workflow is started manually. The workflow
uses Node 22 LTS, the `macos-26` Apple Silicon runner for macOS, and a Windows
runner for Windows.

When a tag matching `v*` is pushed, CI waits for both platform builds, then
creates one GitHub Release and attaches both generated ZIPs.

## Branch And Release Flow

Use `main` as the stable development branch. Normal work should happen on a
feature branch, then merge back through a pull request:

```sh
git switch main
git pull upstream main
git switch -c feature/my-change
```

Push the feature branch and open a PR into `main`. Pull requests and pushes to
`main` run the cheap CI workflow only: install dependencies, typecheck, and unit
tests.

Release packaging is intentionally separate. macOS and Windows builds run only
when a version tag is pushed, or when the release workflow is started manually
from GitHub Actions:

```sh
git switch main
git pull upstream main
git tag v0.1.0
git push upstream v0.1.0
```

Tag releases build the platform ZIPs and attach them to a GitHub Release.
Manual release workflow runs are useful for testing packaged artifacts without
creating a release tag.

The macOS artifact verifier checks:

- The ZIP exists.
- The packaged app has bundle id `dev.geef.divergence-launcher`.
- The packaged app uses `icon.icns`.
- The Divergence xdelta patch is included.
- The patch checksum metadata is included.
- The darwin-arm64 xdelta native addon is included.
- The xdelta native addon license is included.
- Signed builds pass `codesign --verify`.
- Notarized builds pass `xcrun stapler validate`.

The Windows artifact verifier checks:

- The ZIP exists.
- The packaged `.exe` exists.
- The packaged app includes `app.asar`.
- The Divergence xdelta patch is included.
- The patch checksum metadata is included.
- The win32-x64 xdelta native addon is included.
- The xdelta native addon license is included.

## Manual Smoke Test

Before sharing a development build:

1. Open the packaged app from `out/`.
2. Reset launcher data with the debug reset action.
3. Confirm the Play tab points to ROM setup.
4. Select a clean Pokemon Emerald ROM.
5. Confirm the Play tab points to ROM verification until the source is verified.
6. Verify the source ROM.
7. Confirm the Play tab points to patch setup.
8. Apply the Divergence patch.
9. Confirm the managed patched ROM verifies as ready.
10. Confirm the Play tab points to mGBA setup if mGBA is not configured.
11. Configure or detect mGBA.
12. Launch mGBA from the Play tab.
13. Export the patched ROM and confirm the exported file exists.
14. Copy diagnostics from About/settings and confirm the selected source ROM path is not included.

## GitHub Release Tags

To create a release artifact from CI:

```sh
git tag v0.1.0
git push upstream v0.1.0
```

The tag workflow creates the ZIP, verifies it, uploads it as an Actions artifact,
and publishes a GitHub Release with macOS and Windows ZIPs.

## Unsigned macOS Builds

If Apple signing secrets are absent, CI and local builds remain unsigned. macOS
Gatekeeper may warn when opening an unsigned ZIP or app shared outside this
machine.

## Signing And Notarization

Signed and notarized builds require an Apple Developer Program membership, a
Developer ID Application certificate, and App Store Connect API key credentials.

TODO: Signing/notarization is wired but deferred until a personal Apple Developer
account is available. Until then, release artifacts are unsigned development
builds.

Configure these GitHub Actions secrets:

- `APPLE_DEVELOPER_ID_CERTIFICATE_BASE64`: Base64-encoded `.p12` export of the
  Developer ID Application certificate.
- `APPLE_DEVELOPER_ID_CERTIFICATE_PASSWORD`: Password used when exporting the
  `.p12`.
- `APPLE_SIGNING_IDENTITY`: Full codesign identity, for example
  `Developer ID Application: Your Name (TEAMID)`.
- `APPLE_API_KEY_BASE64`: Base64-encoded App Store Connect `.p8` API key.
- `APPLE_API_KEY_ID`: App Store Connect API key ID.
- `APPLE_API_ISSUER`: App Store Connect issuer UUID.

To create the base64 secret values locally:

```sh
base64 -i DeveloperIDApplication.p12 | tr -d '\n' | pbcopy
base64 -i AuthKey_XXXXXXXXXX.p8 | tr -d '\n' | pbcopy
```

The certificate secret enables signing. The API key secrets enable notarization
and stapling. If any notarization value is set, all three API key secrets must be
set together.

## Platform Notes

The xdelta runtime is a native Node addon. The local packaging script copies the
addon for the OS and CPU architecture doing the packaging. That means:

- Apple Silicon macOS builds include the `darwin-arm64` addon.
- Intel macOS builds need to be made on `darwin-x64` or by CI that installs that
  target dependency.
- Windows x64 builds are made on a Windows CI job and include the
  `win32-x64-msvc` addon.
- Linux builds need a Linux packaging job once Linux support is promoted.

Future release CI can become a formal platform matrix once Linux and Intel macOS
are promoted.

## Distribution Rules

Release artifacts may include:

- The launcher application.
- The Divergence xdelta patch.
- Third-party license notices for bundled runtime dependencies.

Release artifacts must not include:

- A base Pokemon Emerald ROM.
- A full pre-patched ROM.
- User save files or local launcher state.
