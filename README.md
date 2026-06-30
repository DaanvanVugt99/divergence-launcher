# Divergence Launcher

Optional desktop launcher for Pokemon Emerald Rogue: Divergence.

The launcher is a companion app. It does not include a Pokemon Emerald ROM, does not emulate the game in a browser, and does not make online services mandatory for normal gameplay.

## v0.1 Scope

- Electron desktop shell.
- TypeScript main, preload, and renderer split.
- React renderer.
- shadcn/ui-style component system with Tailwind CSS.
- Placeholder flows for ROM selection, patch status, mGBA setup, and play.
- Architecture, legal, and roadmap documentation.

Real ROM patching, mGBA launch, and online services are intentionally left for later milestones.

## Development

```sh
npm install
npm start
```

Useful checks:

```sh
npm run typecheck
npm test
```

## Legal

Users must provide their own legally obtained Pokemon Emerald ROM. The launcher must never distribute the base ROM.
