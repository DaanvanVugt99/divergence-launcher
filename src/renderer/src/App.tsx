import { useEffect, useState } from 'react';
import { CheckCircle2, CircleX, Gamepad2, HardDrive, Info, Loader2, Moon, Play, RotateCcw, Settings2, Sun } from 'lucide-react';
import type { LauncherStatus, SourceRomVerificationResult } from '../../preload/launcherApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TooltipProvider } from '@/components/ui/tooltip';
import { MgbaSetupScreen } from '@/screens/MgbaSetupScreen';
import { PatchStatusScreen } from '@/screens/PatchStatusScreen';
import { PlayScreen } from '@/screens/PlayScreen';
import { RomSelectionScreen } from '@/screens/RomSelectionScreen';

const screens = [
  { value: 'play', label: 'Play', icon: Play },
  { value: 'rom', label: 'ROM', icon: HardDrive },
  { value: 'patch', label: 'Patch', icon: Settings2 },
  { value: 'mgba', label: 'mGBA', icon: Gamepad2 },
] as const;

export type LauncherScreen = (typeof screens)[number]['value'];
type Theme = 'light' | 'dark';
type ThemePreference = Theme | 'system';

export const App = () => {
  const [screen, setScreen] = useState<LauncherScreen>('play');
  const [systemTheme, setSystemTheme] = useState<Theme>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  );
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => {
    const savedTheme = window.localStorage.getItem('divergence-theme-preference');

    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
      return savedTheme;
    }

    return 'system';
  });
  const [status, setStatus] = useState<LauncherStatus | null>(null);
  const [hasLoadedStatus, setHasLoadedStatus] = useState(false);
  const [selectedRomPath, setSelectedRomPath] = useState<string | null>(null);
  const [selectedMgbaPath, setSelectedMgbaPath] = useState<string | null>(null);
  const [romVerification, setRomVerification] = useState<SourceRomVerificationResult | null>(null);
  const [isVerifyingRom, setIsVerifyingRom] = useState(false);
  const [isPatching, setIsPatching] = useState(false);
  const [patchError, setPatchError] = useState<string | null>(null);
  const [patchSuccess, setPatchSuccess] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [launchStatus, setLaunchStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLaunchingMgba, setIsLaunchingMgba] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const resolvedTheme = themePreference === 'system' ? systemTheme : themePreference;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');

    if (themePreference === 'system') {
      window.localStorage.removeItem('divergence-theme-preference');
      return;
    }

    window.localStorage.setItem('divergence-theme-preference', themePreference);
  }, [resolvedTheme, themePreference]);

  const refreshStatus = async (options?: { replaceLocalState?: boolean }) => {
    const nextStatus = await window.launcher.getStatus();
    const storedVerification = nextStatus.settings.lastSourceRomVerification;

    setStatus(nextStatus);
    setSelectedRomPath((current) => (options?.replaceLocalState ? nextStatus.romLibrary.sourceRomPath : current ?? nextStatus.romLibrary.sourceRomPath));
    setSelectedMgbaPath((current) => (options?.replaceLocalState ? nextStatus.mgba.path : current ?? nextStatus.mgba.path));
    setRomVerification((current) => {
      if (current) {
        return current;
      }

      if (!storedVerification || storedVerification.path !== nextStatus.romLibrary.sourceRomPath) {
        return null;
      }

      const matchedProfile =
        nextStatus.patchPlan.expectedBaseRoms.find((profile) => profile.id === storedVerification.matchedProfileId) ?? null;

      return {
        path: storedVerification.path,
        sha256: storedVerification.sha256,
        status: storedVerification.status,
        matchedProfile,
        expectedProfiles: nextStatus.patchPlan.expectedBaseRoms,
      };
    });
  };

  useEffect(() => {
    refreshStatus()
      .catch(() => setStatus(null))
      .finally(() => setHasLoadedStatus(true));
  }, []);

  const effectiveMgbaPath = selectedMgbaPath ?? status?.mgba.path ?? null;
  const sourceRomPath = selectedRomPath ?? status?.romLibrary.sourceRomPath ?? null;
  const sourceVerified =
    romVerification?.status === 'valid' ||
    Boolean(
      status?.settings.lastSourceRomVerification?.status === 'valid' &&
        status.settings.lastSourceRomVerification.path === sourceRomPath,
    );
  const patchApplied = Boolean(
    status?.romLibrary.hasPatchedRom &&
      status.romLibrary.lastPatchedSha256 &&
      status.romLibrary.lastPatchedSha256 === status.patchPlan.expectedPatchedRom.sha256,
  );
  const mgbaReady = status?.mgba.status === 'found';
  const playReady = patchApplied && mgbaReady;
  const tabCompletion: Record<LauncherScreen, boolean> = {
    play: playReady,
    rom: sourceVerified,
    patch: patchApplied,
    mgba: mgbaReady,
  };
  const chooseRom = async () => {
    const result = await window.launcher.selectRom();
    if (result) {
      setSelectedRomPath(result.path);
      setRomVerification(null);
      setPatchError(null);
      setLaunchStatus(null);
    }
  };

  const verifyRom = async (romPath = sourceRomPath) => {
    if (!romPath) {
      return;
    }

    setIsVerifyingRom(true);
    setPatchError(null);

    try {
      const result = await window.launcher.verifySelectedRom(romPath);
      setRomVerification(result);
      await refreshStatus();
    } catch (error) {
      setPatchError(error instanceof Error ? error.message : 'ROM verification failed.');
    } finally {
      setIsVerifyingRom(false);
    }
  };

  const patchRom = async () => {
    if (!sourceRomPath) {
      setPatchError('Select a source ROM before patching.');
      return;
    }

    setIsPatching(true);
    setPatchError(null);
    setPatchSuccess(null);
    setLaunchStatus(null);

    try {
      const result = await window.launcher.patchSelectedRom(sourceRomPath);
      setPatchSuccess(`Patched ROM verified: ${result.patchedSha256}`);
      await refreshStatus();
    } catch (error) {
      setPatchError(error instanceof Error ? error.message : 'Patch failed.');
    } finally {
      setIsPatching(false);
    }
  };

  const chooseMgba = async () => {
    const result = await window.launcher.selectMgba();
    if (result) {
      setSelectedMgbaPath(result.path);
      setLaunchStatus(null);
      await refreshStatus();
    }
  };

  const exportPatchedRom = async () => {
    setExportStatus(null);
    setLaunchStatus(null);

    try {
      const result = await window.launcher.exportPatchedRom();
      setExportStatus(result ? `Exported to ${result.path}` : 'Export canceled');
    } catch (error) {
      setExportStatus(error instanceof Error ? error.message : 'Export failed.');
    }
  };

  const openPatchedRomFolder = async () => {
    try {
      await window.launcher.openPatchedRomFolder();
    } catch (error) {
      setExportStatus(error instanceof Error ? error.message : 'Could not open patched ROM folder.');
    }
  };

  const launchMgba = async () => {
    setIsLaunchingMgba(true);
    setLaunchStatus(null);
    setExportStatus(null);

    try {
      const result = await window.launcher.launchMgba();
      setLaunchStatus({
        type: 'success',
        message: `Started mGBA with ${result.romPath}`,
      });
      await refreshStatus();
    } catch (error) {
      setLaunchStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not launch mGBA.',
      });
    } finally {
      setIsLaunchingMgba(false);
    }
  };

  const resetLauncherData = async () => {
    const confirmed = window.confirm(
      'Reset launcher data? This clears selected paths, verification state, mGBA configuration, and the managed patched ROM. It will not delete your original ROM file.',
    );

    if (!confirmed) {
      return;
    }

    setIsResetting(true);

    try {
      await window.launcher.resetData();
      window.localStorage.clear();
      setThemePreference('system');
      setSelectedRomPath(null);
      setSelectedMgbaPath(null);
      setRomVerification(null);
      setPatchError(null);
      setPatchSuccess(null);
      setExportStatus(null);
      setLaunchStatus(null);
      await refreshStatus({ replaceLocalState: true });
    } finally {
      setIsResetting(false);
    }
  };

  const toggleTheme = () => {
    setThemePreference(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const appShell = (
    <TooltipProvider>
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-5">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-card">
                  <Gamepad2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-normal">Divergence Launcher</h1>
                  <p className="text-sm text-muted-foreground">Pokemon Emerald Rogue: Divergence desktop companion</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="icon" className="h-8 w-8" aria-label="Open settings">
                        <Info className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>About and settings</TooltipContent>
                </Tooltip>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Divergence Launcher</DialogTitle>
                    <DialogDescription>Optional desktop launcher for Pokemon Emerald Rogue: Divergence.</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="grid gap-2 rounded-md border p-4 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Version</span>
                        <Badge variant="secondary">{status?.app.version ?? '0.1.0'}</Badge>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Build</span>
                        <span className="font-medium">GEEF</span>
                      </div>
                    </div>

                    <div className="rounded-md border p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h2 className="text-sm font-semibold">Debug reset</h2>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Clear launcher settings, selected paths, verification state, and the managed patched ROM.
                          </p>
                        </div>
                        <Button type="button" variant="destructive" onClick={resetLauncherData} disabled={isResetting} className="shrink-0">
                          {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                          Reset
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="outline" size="icon" onClick={toggleTheme} className="h-8 w-8" aria-label="Toggle theme">
                    {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{resolvedTheme === 'dark' ? 'Use light mode' : 'Use dark mode'}</TooltipContent>
              </Tooltip>
            </div>
          </header>

          <Separator className="my-5" />

          <Tabs value={screen} onValueChange={(value) => setScreen(value as LauncherScreen)} className="flex flex-1 flex-col">
            <TabsList className="grid w-full grid-cols-4">
              {screens.map((item) => (
                <TabsTrigger key={item.value} value={item.value} className="gap-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {tabCompletion[item.value] ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <CircleX className="h-3.5 w-3.5 text-red-500/70 dark:text-red-400/80" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-5 flex-1">
              <TabsContent value="rom" className="mt-0">
                <RomSelectionScreen
                  selectedRomPath={sourceRomPath}
                  onChooseRom={chooseRom}
                  onVerifyRom={() => verifyRom()}
                  verification={romVerification}
                  sourceVerified={sourceVerified}
                  isVerifying={isVerifyingRom}
                />
              </TabsContent>
              <TabsContent value="patch" className="mt-0">
                <PatchStatusScreen
                  selectedRomPath={sourceRomPath}
                  status={status}
                  verification={romVerification}
                  sourceVerified={sourceVerified}
                  isPatching={isPatching}
                  patchError={patchError}
                  patchSuccess={patchSuccess}
                  onVerifyRom={() => verifyRom()}
                  onPatchRom={patchRom}
                />
              </TabsContent>
              <TabsContent value="mgba" className="mt-0">
                <MgbaSetupScreen
                  detectedMgbaPath={status?.mgba.path ?? null}
                  selectedMgbaPath={selectedMgbaPath}
                  onChooseMgba={chooseMgba}
                  onOpenDownload={() => window.launcher.openExternal('https://mgba.io/downloads.html')}
                />
              </TabsContent>
              <TabsContent value="play" className="mt-0">
                <PlayScreen
                  patchedRomPath={status?.romLibrary.patchedRomPath ?? null}
                  hasPatchedRom={status?.romLibrary.hasPatchedRom ?? false}
                  patchedSha256={status?.romLibrary.lastPatchedSha256 ?? null}
                  mgbaPath={effectiveMgbaPath}
                  hasSourceRom={Boolean(sourceRomPath)}
                  sourceVerified={sourceVerified}
                  patchApplied={patchApplied}
                  mgbaReady={mgbaReady}
                  exportStatus={exportStatus}
                  launchStatus={launchStatus}
                  isLaunchingMgba={isLaunchingMgba}
                  onExportPatchedRom={exportPatchedRom}
                  onOpenPatchedRomFolder={openPatchedRomFolder}
                  onLaunchMgba={launchMgba}
                  onSelectPatchedRomSetup={() => setScreen(sourceRomPath ? 'patch' : 'rom')}
                  onSelectMgbaSetup={() => setScreen('mgba')}
                />
              </TabsContent>
            </div>
          </Tabs>

          <footer className="py-4 text-center text-xs text-muted-foreground/70">GEEF · {status?.app.version ?? '0.1.0'}</footer>
        </div>
      </main>
    </TooltipProvider>
  );

  if (!hasLoadedStatus) {
    return (
      <TooltipProvider>
        <main className="min-h-screen bg-background text-foreground">
          <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-5">
            <header className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-card">
                  <Gamepad2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-normal">Divergence Launcher</h1>
                  <p className="text-sm text-muted-foreground">Pokemon Emerald Rogue: Divergence desktop companion</p>
                </div>
              </div>
            </header>

            <Separator className="my-5" />

            <div className="flex flex-1 items-center justify-center rounded-md border bg-card">
              <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading launcher state</span>
              </div>
            </div>
          </div>
        </main>
      </TooltipProvider>
    );
  }

  return appShell;
};
