export interface RomChecksumProfile {
  id: string;
  label: string;
  sha256: string | null;
}

export const acceptedBaseRomProfiles: RomChecksumProfile[] = [
  {
    id: 'pokemon-emerald-us-revision-unset',
    label: 'Pokemon Emerald base ROM checksum not configured',
    sha256: null,
  },
];

export const patchedRomProfile: RomChecksumProfile = {
  id: 'divergence-v0.1-unset',
  label: 'Divergence v0.1 patched ROM checksum not configured',
  sha256: null,
};
