# Legal And Distribution Notes

The launcher must never distribute a base Pokemon Emerald ROM. Users must provide their own legally obtained ROM.

## ROM Patching

The planned patching flow is:

1. User selects a source ROM.
2. Launcher computes its checksum.
3. Launcher verifies the checksum against accepted clean base ROM profiles.
4. Launcher applies the Divergence xdelta patch.
5. Launcher verifies the patched output checksum.
6. Launcher stores the patched ROM in app data and offers export/open-folder actions.

The xdelta patch artifact must not contain or reconstruct a base ROM by itself.

## mGBA

v0.1 assumes mGBA is installed externally. The launcher may detect common install locations or ask the user to select the executable.

mGBA is MPL-2.0 licensed. Bundling may be possible later, but it requires explicit license compliance, notices, packaging work, and an update policy.

## Third-Party Native Code

v0.2 uses `@chainsafe/xdelta3-node` for local xdelta support. The package is Apache-2.0 licensed.

Packaged builds copy the platform native addon outside the application ASAR under `resources/xdelta/native`. Keep the package license notice with published builds.

The launcher must still fail clearly if a target platform build does not include a usable xdelta native addon.
