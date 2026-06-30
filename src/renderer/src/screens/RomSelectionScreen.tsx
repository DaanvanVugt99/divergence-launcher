import { FileUp, ShieldCheck } from 'lucide-react';
import type { LauncherStatus } from '../../../preload/launcherApi';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

interface RomSelectionScreenProps {
  selectedRomPath: string | null;
  status: LauncherStatus | null;
  setupProgress: number;
  onChooseRom: () => void;
  onContinue: () => void;
}

export const RomSelectionScreen = ({
  selectedRomPath,
  status,
  setupProgress,
  onChooseRom,
  onContinue,
}: RomSelectionScreenProps) => (
  <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
    <Card>
      <CardHeader>
        <CardTitle>Source ROM</CardTitle>
        <CardDescription>Select a legally obtained Pokemon Emerald ROM to prepare Divergence.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>ROM required from user</AlertTitle>
          <AlertDescription>The launcher will never ship a base Pokemon Emerald ROM.</AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="rom-path">Selected file</Label>
          <div className="flex gap-2">
            <Input id="rom-path" readOnly value={selectedRomPath ?? ''} placeholder="No ROM selected" />
            <Button type="button" onClick={onChooseRom} className="shrink-0 gap-2">
              <FileUp className="h-4 w-4" />
              Choose
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button type="button" onClick={onContinue} disabled={!selectedRomPath}>
          Continue
        </Button>
      </CardFooter>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Setup</CardTitle>
        <CardDescription>Current v0.1 shell state.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={setupProgress} />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">App data</span>
            <span className="truncate text-right">{status?.paths.appDataDir ?? 'Loading'}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Patched ROM</span>
            <span className="truncate text-right">{status?.romLibrary.patchedRomPath ?? 'Not prepared'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);
