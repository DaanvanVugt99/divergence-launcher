export interface LauncherSettings {
  mgbaPath: string | null;
}

export const getSettingsSnapshot = (): LauncherSettings => ({
  mgbaPath: null,
});
