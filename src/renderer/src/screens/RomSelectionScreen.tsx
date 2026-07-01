import { FileUp, ShieldCheck } from 'lucide-react';
import type { SourceRomVerificationResult } from '../../../preload/launcherApi';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RomSelectionScreenProps {
  selectedRomPath: string | null;
  verification: SourceRomVerificationResult | null;
  sourceVerified: boolean;
  isVerifying: boolean;
  onChooseRom: () => void;
  onVerifyRom: () => void;
}

export const RomSelectionScreen = ({
  selectedRomPath,
  verification,
  sourceVerified,
  isVerifying,
  onChooseRom,
  onVerifyRom,
}: RomSelectionScreenProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Source ROM</CardTitle>
      <CardDescription>
        Select a legally obtained Pokemon Emerald ROM to prepare Divergence.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-5">
      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>ROM required from user</AlertTitle>
        <AlertDescription>
          The launcher will never ship a base Pokemon Emerald ROM.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="rom-path">Selected file</Label>
        <div className="flex gap-2">
          <Input
            id="rom-path"
            readOnly
            value={selectedRomPath ?? ''}
            placeholder="No ROM selected"
          />
          <Button type="button" onClick={onChooseRom} className="shrink-0 gap-2">
            <FileUp className="h-4 w-4" />
            Choose
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Checksum</div>
            <div className="mt-1 break-all text-sm text-muted-foreground">
              {verification?.sha256 ?? 'Not verified yet'}
            </div>
          </div>
          <Badge variant={sourceVerified ? 'default' : verification ? 'destructive' : 'secondary'}>
            {sourceVerified ? 'Accepted' : verification ? 'Rejected' : 'Pending'}
          </Badge>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onVerifyRom}
          disabled={!selectedRomPath || isVerifying}
          className="mt-4"
        >
          {isVerifying ? 'Verifying...' : 'Verify ROM'}
        </Button>
      </div>
    </CardContent>
  </Card>
);
