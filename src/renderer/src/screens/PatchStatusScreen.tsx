import { ArrowLeft, ArrowRight, Wrench } from 'lucide-react';
import type { LauncherStatus } from '../../../preload/launcherApi';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface PatchStatusScreenProps {
  selectedRomPath: string | null;
  status: LauncherStatus | null;
  onBack: () => void;
  onContinue: () => void;
}

export const PatchStatusScreen = ({ selectedRomPath, status, onBack, onContinue }: PatchStatusScreenProps) => (
  <Card>
    <CardHeader>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Patch Status</CardTitle>
          <CardDescription>v0.1 defines the patching contract without applying the patch yet.</CardDescription>
        </div>
        <Badge variant="secondary">Not implemented</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-5">
      <Alert>
        <Wrench className="h-4 w-4" />
        <AlertTitle>xdelta integration planned</AlertTitle>
        <AlertDescription>
          The next milestone will verify the source ROM checksum, run bundled xdelta, and verify the patched ROM.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border bg-card p-4">
          <div className="text-sm font-medium">Source ROM</div>
          <div className="mt-2 truncate text-sm text-muted-foreground">{selectedRomPath ?? 'No ROM selected'}</div>
        </div>
        <div className="rounded-md border bg-card p-4">
          <div className="text-sm font-medium">Patch artifact</div>
          <div className="mt-2 truncate text-sm text-muted-foreground">{status?.patchPlan.patchFileName ?? 'Loading'}</div>
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <div className="text-sm font-medium">Patch version</div>
          <div className="text-sm text-muted-foreground">{status?.patchPlan.patchVersion ?? 'v0.1'}</div>
        </div>
        <div>
          <div className="text-sm font-medium">Output file</div>
          <div className="text-sm text-muted-foreground">{status?.patchPlan.outputFileName ?? 'Not set'}</div>
        </div>
        <div>
          <div className="text-sm font-medium">Runtime dependency</div>
          <div className="text-sm text-muted-foreground">Bundled xdelta binary, later milestone</div>
        </div>
      </div>
    </CardContent>
    <CardFooter className="justify-between gap-3">
      <Button type="button" variant="outline" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <Button type="button" onClick={onContinue} className="gap-2">
        Continue
        <ArrowRight className="h-4 w-4" />
      </Button>
    </CardFooter>
  </Card>
);
