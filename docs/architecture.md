# Architecture

Divergence Launcher is an optional Electron companion app for Pokemon Emerald Rogue: Divergence. It is not an emulator and it is not part of the ROM repository.

## Process Model

- Main process owns local system access: dialogs, app data paths, ROM hashing, xdelta execution, mGBA detection, and mGBA launch.
- Preload exposes a small typed API with `contextBridge`.
- Renderer is a React app built with shadcn/ui-style components and Tailwind CSS.

The renderer must not receive direct Node access.

## v0.1 Boundaries

The v0.1 app shell contains placeholder flows only:

- ROM selection.
- Patch status.
- mGBA setup.
- Play.

Real patch execution, checksum verification, settings persistence, and native mGBA launch are later milestones.

## Future Mailbox Model

Future ROM-to-launcher communication should use a small mailbox/protocol design. The ROM should exchange compact records and continue working if the launcher or online service is unavailable.

Online ghost rival data should live in online services and a launcher cache, not as a large ROM payload.
