# Architecture

Divergence Launcher is an optional Electron companion app for Pokemon Emerald Rogue: Divergence. It is not an emulator and it is not part of the ROM repository.

## Process Model

- Main process owns local system access: dialogs, app data paths, ROM hashing, xdelta execution, mGBA detection, and mGBA launch.
- Preload exposes a small typed API with `contextBridge`.
- Renderer is a React app built with shadcn/ui-style components and Tailwind CSS.

The renderer must not receive direct Node access.

## v0.2 Local Patching

The launcher performs ROM verification and patching entirely in the main process:

- `checksums.json` declares accepted source ROM hashes, the patch file name, and the expected patched ROM hash.
- `selectRom` stores only the selected source ROM path. The base ROM is never copied into app data.
- `verifySelectedRom` streams SHA-256 over the selected ROM and matches it against configured source profiles.
- `patchSelectedRom` decodes the local xdelta patch to a temp file, verifies the patched SHA-256, then replaces the managed ROM.
- `exportPatchedRom` copies the managed patched ROM to a user-selected destination.
- `openPatchedRomFolder` opens the managed ROM directory for users who want to use another emulator.

The local xdelta runtime is provided by `@chainsafe/xdelta3-node`. Packaged builds copy the current platform native addon into `resources/xdelta/native` during `npm run package`, then load it from Electron resources if `node_modules` is not present.

## v0.3 mGBA Launch

The launcher still assumes mGBA is installed externally. The main process detects or resolves the executable path, verifies the managed patched ROM hash, then starts mGBA with the patched ROM path as its only argument.

Launches are fire-and-forget. After mGBA starts successfully, it runs independently from the launcher.

## Future Mailbox Model

Future ROM-to-launcher communication should use a small mailbox/protocol design. The ROM should exchange compact records and continue working if the launcher or online service is unavailable.

Online ghost rival data should live in online services and a launcher cache, not as a large ROM payload.
