# Divergence Launcher

Optional desktop launcher for Pokemon Emerald Rogue: Divergence.

The launcher is a companion app. It does not include a Pokemon Emerald ROM, does not emulate the game in a browser, and does not make online services mandatory for normal gameplay.

See [docs/roadmap.md](docs/roadmap.md) for planned milestones.
See [docs/release.md](docs/release.md) for local packaging notes.
See [CHANGELOG.md](CHANGELOG.md) for release notes.

## Development

```sh
npm install
npm start
```

Useful checks:

```sh
npm run typecheck
npm test
npm run release:mac
```

Generate the local patch artifact from a clean Emerald ROM and a local `pokeemerald-rogue` checkout:

```sh
npm run generate:patch -- --source-rom <clean-emerald.gba> --rogue-repo <pokeemerald-rogue>
```

## Legal

Users must provide their own legally obtained Pokemon Emerald ROM. The launcher must never distribute the base ROM.
