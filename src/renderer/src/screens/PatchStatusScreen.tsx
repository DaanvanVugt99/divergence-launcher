import { CheckCircle2, CircleAlert, Wrench } from 'lucide-react';
import type { LauncherStatus, SourceRomVerificationResult } from '../../../preload/launcherApi';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface PatchStatusScreenProps {
  selectedRomPath: string | null;
  status: LauncherStatus | null;
  verification: SourceRomVerificationResult | null;
  sourceVerified: boolean;
  isPatching: boolean;
  patchError: string | null;
  patchSuccess: string | null;
  onVerifyRom: () => void;
  onPatchRom: () => void;
}

const statusLabel = (status: LauncherStatus | null) => {
  if (!status) {
    return 'Loading';
  }

  if (status.patchPlan.status === 'ready') {
    return 'Ready';
  }

  if (status.patchPlan.status === 'missing') {
    return 'Missing patch';
  }

  return 'Invalid metadata';
};

export const PatchStatusScreen = ({
  selectedRomPath,
  status,
  verification,
  sourceVerified,
  isPatching,
  patchError,
  patchSuccess,
  onVerifyRom,
  onPatchRom,
}: PatchStatusScreenProps) => {
  const canPatch = Boolean(selectedRomPath && sourceVerified && status?.patchPlan.status === 'ready');
  const patchApplied = Boolean(
    status?.romLibrary.hasPatchedRom &&
      status.romLibrary.lastPatchedSha256 &&
      status.romLibrary.lastPatchedSha256 === status.patchPlan.expectedPatchedRom.sha256,
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Patch Status</CardTitle>
            <CardDescription>Verify the source ROM, apply the Divergence patch, and validate the patched output.</CardDescription>
          </div>
          <Badge variant={status?.patchPlan.status === 'ready' ? 'default' : 'destructive'}>{statusLabel(status)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {patchError ? (
          <Alert variant="destructive">
            <CircleAlert className="h-4 w-4" />
            <AlertTitle>Patch failed</AlertTitle>
            <AlertDescription>{patchError}</AlertDescription>
          </Alert>
        ) : patchSuccess ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Patched ROM ready</AlertTitle>
            <AlertDescription className="break-all">{patchSuccess}</AlertDescription>
          </Alert>
        ) : null}

        {status?.patchPlan.errorMessage ? (
          <Alert variant="destructive">
            <CircleAlert className="h-4 w-4" />
            <AlertTitle>Patch resources unavailable</AlertTitle>
            <AlertDescription>{status.patchPlan.errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border bg-card p-4">
            <div className="text-sm font-medium">Source ROM</div>
            <div className="mt-2 truncate text-sm text-muted-foreground">{selectedRomPath ?? 'No ROM selected'}</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant={sourceVerified ? 'default' : verification ? 'destructive' : 'secondary'}>
                {sourceVerified ? 'Verified' : verification ? 'Rejected' : 'Unverified'}
              </Badge>
              <Button type="button" size="sm" variant="outline" onClick={onVerifyRom} disabled={!selectedRomPath || isPatching}>
                Verify
              </Button>
            </div>
          </div>
          <div className="rounded-md border bg-card p-4">
            <div className="text-sm font-medium">Patch artifact</div>
            <div className="mt-2 truncate text-sm text-muted-foreground">{status?.patchPlan.patchFilePath ?? 'Loading'}</div>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-sm font-medium">Patch version</div>
            <div className="text-sm text-muted-foreground">{status?.patchPlan.patchVersion ?? 'v0.1'}</div>
          </div>
          <div>
            <div className="text-sm font-medium">Expected source</div>
            <div className="text-sm text-muted-foreground">{status?.patchPlan.expectedBaseRoms[0]?.label ?? 'Not configured'}</div>
          </div>
          <div>
            <div className="text-sm font-medium">Output file</div>
            <div className="text-sm text-muted-foreground">{status?.patchPlan.outputFileName ?? 'Not set'}</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-3">
        <Button type="button" variant={patchApplied ? 'outline' : 'default'} onClick={onPatchRom} disabled={!canPatch || isPatching} className="gap-2">
          <Wrench className="h-4 w-4" />
          {isPatching ? 'Patching...' : patchApplied ? 'Reapply Patch' : 'Apply Patch'}
        </Button>
      </CardFooter>
    </Card>
  );
};
