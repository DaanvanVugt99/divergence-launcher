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

Update the local patch artifact from a clean Emerald ROM and a sibling
`pokeemerald-rogue` checkout:

```sh
npm run update:patch
```

The default source ROM path is
`local/roms/source/Pokemon - Emerald Version (USA, Europe).gba`. The `local/`
directory is ignored because it is only for legal local inputs and scratch files.
Only commit the generated xdelta patch and checksum metadata.

For non-default paths:

```sh
npm run update:patch -- --source-rom <clean-emerald.gba> --rogue-repo <pokeemerald-rogue>
```

## Development Workflow

Work on feature branches and merge through PRs into `main`. PRs and pushes to
`main` run only CI checks: typecheck and unit tests.

Release packaging is separate. macOS and Windows artifacts are built only from
version tags like `v0.1.0`, or by manually running the release workflow in
GitHub Actions.

See [docs/release.md](docs/release.md) for release commands and packaging
details.

## Legal

Users must provide their own legally obtained Pokemon Emerald ROM. The launcher must never distribute the base ROM.
