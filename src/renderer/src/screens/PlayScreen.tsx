import {
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  FolderOpen,
  Loader2,
  Play,
  Save,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatPathForWrap } from '@/lib/formatPath';

interface PlayScreenProps {
  patchedRomPath: string | null;
  hasPatchedRom: boolean;
  patchedSha256: string | null;
  mgbaPath: string | null;
  hasSourceRom: boolean;
  sourceVerified: boolean;
  patchApplied: boolean;
  mgbaReady: boolean;
  exportStatus: string | null;
  launchStatus: { type: 'success' | 'error'; message: string } | null;
  isLaunchingMgba: boolean;
  onExportPatchedRom: () => void;
  onOpenPatchedRomFolder: () => void;
  onLaunchMgba: () => void;
  onSelectPatchedRomSetup: () => void;
  onSelectMgbaSetup: () => void;
}

export const PlayScreen = ({
  patchedRomPath,
  hasPatchedRom,
  patchedSha256,
  mgbaPath,
  hasSourceRom,
  sourceVerified,
  patchApplied,
  mgbaReady,
  exportStatus,
  launchStatus,
  isLaunchingMgba,
  onExportPatchedRom,
  onOpenPatchedRomFolder,
  onLaunchMgba,
  onSelectPatchedRomSetup,
  onSelectMgbaSetup,
}: PlayScreenProps) => {
  const readyForNativePlay = patchApplied && mgbaReady;
  const nextStep = (() => {
    if (!hasSourceRom) {
      return {
        title: 'Choose a source ROM',
        description: 'Select your legally obtained Pokemon Emerald ROM to start local setup.',
        buttonLabel: 'Set up ROM',
        onSelect: onSelectPatchedRomSetup,
      };
    }

    if (!sourceVerified) {
      return {
        title: 'Verify the source ROM',
        description: 'Confirm the selected ROM matches the supported Pokemon Emerald checksum.',
        buttonLabel: 'Verify ROM',
        onSelect: onSelectPatchedRomSetup,
      };
    }

    if (!patchApplied) {
      return {
        title: 'Apply the Divergence patch',
        description: 'Create and verify the managed patched ROM stored by the launcher.',
        buttonLabel: 'Open patch',
        onSelect: onSelectPatchedRomSetup,
      };
    }

    if (!mgbaReady) {
      return {
        title: 'Set up mGBA',
        description: 'Select an installed mGBA executable before launching native play.',
        buttonLabel: 'Set up mGBA',
        onSelect: onSelectMgbaSetup,
      };
    }

    return null;
  })();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Play</CardTitle>
            <CardDescription>Launch and export the managed Divergence ROM.</CardDescription>
          </div>
          <Badge variant={readyForNativePlay ? 'default' : patchApplied ? 'secondary' : 'outline'}>
            {readyForNativePlay ? 'Ready' : patchApplied ? 'ROM ready' : 'Needs setup'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <Alert>
          {readyForNativePlay ? <CheckCircle2 className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <AlertTitle>
            {readyForNativePlay ? 'Ready for native play' : 'Native emulator flow'}
          </AlertTitle>
          <AlertDescription>
            {readyForNativePlay
              ? 'Divergence is patched and mGBA is configured.'
              : 'The patched ROM remains a normal GBA file and can be exported for other emulators.'}
          </AlertDescription>
        </Alert>

        {!readyForNativePlay && nextStep ? (
          <div className="rounded-md border bg-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{nextStep.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{nextStep.description}</div>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={nextStep.onSelect}
                className="shrink-0 gap-2"
              >
                {nextStep.buttonLabel}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}

        {exportStatus ? (
          <Alert>
            <Save className="h-4 w-4" />
            <AlertTitle>Export</AlertTitle>
            <AlertDescription>{exportStatus}</AlertDescription>
          </Alert>
        ) : null}

        {launchStatus ? (
          <Alert variant={launchStatus.type === 'error' ? 'destructive' : 'default'}>
            {launchStatus.type === 'error' ? (
              <CircleAlert className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <AlertTitle>
              {launchStatus.type === 'error' ? 'Launch failed' : 'mGBA launched'}
            </AlertTitle>
            <AlertDescription className="break-all">{launchStatus.message}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={patchApplied ? undefined : onSelectPatchedRomSetup}
            disabled={patchApplied}
            className="rounded-md border bg-card p-4 text-left transition-colors enabled:hover:bg-accent disabled:cursor-default"
            aria-label={
              patchApplied
                ? 'Patched ROM is ready'
                : hasSourceRom
                  ? 'Open patch setup'
                  : 'Open ROM setup'
            }
          >
            <div className="text-sm font-medium">Patched ROM</div>
            <div
              className={
                patchApplied
                  ? 'mt-2 flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400'
                  : 'mt-2 flex items-center gap-1 text-sm text-red-500/80 dark:text-red-400/90'
              }
            >
              <span>{patchApplied ? 'Ready' : 'Not prepared'}</span>
              {!patchApplied ? <ChevronRight className="h-4 w-4" /> : null}
            </div>
          </button>
          <button
            type="button"
            onClick={mgbaReady ? undefined : onSelectMgbaSetup}
            disabled={mgbaReady}
            className="rounded-md border bg-card p-4 text-left transition-colors enabled:hover:bg-accent disabled:cursor-default"
            aria-label={mgbaReady ? 'mGBA is configured' : 'Open mGBA setup'}
          >
            <div className="text-sm font-medium">mGBA</div>
            <div
              className={
                mgbaReady
                  ? 'mt-2 flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400'
                  : 'mt-2 flex items-center gap-1 text-sm text-red-500/80 dark:text-red-400/90'
              }
            >
              <span>{mgbaReady ? 'Configured' : 'Not configured'}</span>
              {!mgbaReady ? <ChevronRight className="h-4 w-4" /> : null}
            </div>
          </button>
        </div>

        <details className="rounded-md border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">Details</summary>
          <div className="mt-4 grid gap-3">
            <div className="grid gap-1 md:grid-cols-[120px_minmax(0,1fr)]">
              <span className="text-muted-foreground">Patched ROM</span>
              <span className="break-words">
                {formatPathForWrap(hasPatchedRom ? patchedRomPath : null, 'Not prepared')}
              </span>
            </div>
            <div className="grid gap-1 md:grid-cols-[120px_minmax(0,1fr)]">
              <span className="text-muted-foreground">ROM hash</span>
              <span className="break-all">{patchedSha256 ?? 'No verified output yet'}</span>
            </div>
            <div className="grid gap-1 md:grid-cols-[120px_minmax(0,1fr)]">
              <span className="text-muted-foreground">mGBA</span>
              <span className="break-words">{formatPathForWrap(mgbaPath, 'Not configured')}</span>
            </div>
          </div>
        </details>
      </CardContent>
      <CardFooter className="justify-end gap-3">
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onOpenPatchedRomFolder}
            disabled={!hasPatchedRom}
            className="gap-2"
          >
            <FolderOpen className="h-4 w-4" />
            Open Folder
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onExportPatchedRom}
            disabled={!patchApplied}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Export ROM
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={onLaunchMgba}
            disabled={!readyForNativePlay || isLaunchingMgba}
            className="gap-2"
          >
            {isLaunchingMgba ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            {isLaunchingMgba ? 'Launching...' : 'Launch mGBA'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
