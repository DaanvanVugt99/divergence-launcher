# Local xdelta Runtime

v0.2 uses `@chainsafe/xdelta3-node` for local xdelta encode/decode support.
The launcher packages the native addon through Electron Forge native unpacking.

The npm package is licensed Apache-2.0. Keep its license in distribution
notices when packaged builds are published.

The platform folders under `resources/xdelta/` are reserved for a future
standalone CLI-binary fallback if the native addon approach stops fitting the
launcher.
