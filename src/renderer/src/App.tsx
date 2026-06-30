import { useEffect, useMemo, useState } from 'react';
import { Gamepad2, HardDrive, Moon, Play, Settings2, Sun } from 'lucide-react';
import type { LauncherStatus } from '../../preload/launcherApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  const [selectedRomPath, setSelectedRomPath] = useState<string | null>(null);
  const [selectedMgbaPath, setSelectedMgbaPath] = useState<string | null>(null);

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

  useEffect(() => {
    window.launcher.getStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  const effectiveMgbaPath = selectedMgbaPath ?? status?.mgba.path ?? null;
  const setupProgress = useMemo(() => {
    const completed = [selectedRomPath, status?.patchPlan.status, effectiveMgbaPath].filter(Boolean).length;
    return Math.round((completed / 3) * 100);
  }, [effectiveMgbaPath, selectedRomPath, status?.patchPlan.status]);

  const chooseRom = async () => {
    const result = await window.launcher.selectRom();
    if (result) {
      setSelectedRomPath(result.path);
      setScreen('patch');
    }
  };

  const chooseMgba = async () => {
    const result = await window.launcher.selectMgba();
    if (result) {
      setSelectedMgbaPath(result.path);
      setScreen('play');
    }
  };

  const toggleTheme = () => {
    setThemePreference(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
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
              <Badge variant={status?.mgba.status === 'found' ? 'default' : 'secondary'} className="h-8 px-3">
                {status?.mgba.status === 'found' ? 'mGBA detected' : 'v0.1 shell'}
              </Badge>
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
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-5 flex-1">
              <TabsContent value="rom" className="mt-0">
                <RomSelectionScreen
                  selectedRomPath={selectedRomPath}
                  status={status}
                  setupProgress={setupProgress}
                  onChooseRom={chooseRom}
                  onContinue={() => setScreen('patch')}
                />
              </TabsContent>
              <TabsContent value="patch" className="mt-0">
                <PatchStatusScreen
                  selectedRomPath={selectedRomPath}
                  status={status}
                  onBack={() => setScreen('rom')}
                  onContinue={() => setScreen('mgba')}
                />
              </TabsContent>
              <TabsContent value="mgba" className="mt-0">
                <MgbaSetupScreen
                  detectedMgbaPath={status?.mgba.path ?? null}
                  selectedMgbaPath={selectedMgbaPath}
                  onChooseMgba={chooseMgba}
                  onOpenDownload={() => window.launcher.openExternal('https://mgba.io/downloads.html')}
                  onContinue={() => setScreen('play')}
                />
              </TabsContent>
              <TabsContent value="play" className="mt-0">
                <PlayScreen
                  patchedRomPath={status?.romLibrary.patchedRomPath ?? null}
                  mgbaPath={effectiveMgbaPath}
                  onBack={() => setScreen('mgba')}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </TooltipProvider>
  );
};
