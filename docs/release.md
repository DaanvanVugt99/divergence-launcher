# Release Checklist

v0.6 supports macOS arm64 release artifacts, optional Apple Developer ID signing
and notarization, and tag-triggered GitHub Releases.

## Local macOS Build

Use Node 22 or newer, then run:

```sh
npm install
npm run release:mac
```

The generated app and ZIP are written under `out/`.

`release:mac` runs the TypeScript check, unit tests, macOS app packaging,
deterministic ZIP creation with `ditto`, and the artifact verifier.

## CI Build

GitHub Actions builds the macOS arm64 ZIP on pushes, pull requests, tags, and
manual workflow dispatches. The workflow uses Node 22 LTS on the `macos-26`
Apple Silicon runner and uploads the generated ZIP as an artifact.

When a tag matching `v*` is pushed, CI also creates a GitHub Release and attaches
the generated ZIP.

The CI artifact verifier checks:

- The ZIP exists.
- The packaged app has bundle id `dev.geef.divergence-launcher`.
- The packaged app uses `icon.icns`.
- The Divergence xdelta patch is included.
- The patch checksum metadata is included.
- The darwin-arm64 xdelta native addon is included.
- The xdelta native addon license is included.
- Signed builds pass `codesign --verify`.
- Notarized builds pass `xcrun stapler validate`.

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

## GitHub Release Tags

To create a release artifact from CI:

```sh
git tag v0.1.0
git push upstream v0.1.0
```

The tag workflow creates the ZIP, verifies it, uploads it as an Actions artifact,
and publishes a GitHub Release.

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
