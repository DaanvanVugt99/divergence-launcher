import { Download, FolderOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MgbaSetupScreenProps {
  detectedMgbaPath: string | null;
  selectedMgbaPath: string | null;
  onChooseMgba: () => void;
  onOpenDownload: () => void;
  onContinue: () => void;
}

export const MgbaSetupScreen = ({
  detectedMgbaPath,
  selectedMgbaPath,
  onChooseMgba,
  onOpenDownload,
  onContinue,
}: MgbaSetupScreenProps) => {
  const mgbaPath = selectedMgbaPath ?? detectedMgbaPath;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>mGBA Setup</CardTitle>
            <CardDescription>Use an externally installed mGBA build for native desktop play.</CardDescription>
          </div>
          <Badge variant={mgbaPath ? 'default' : 'secondary'}>{mgbaPath ? 'Configured' : 'Not configured'}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="mgba-path">mGBA executable</Label>
          <div className="flex gap-2">
            <Input id="mgba-path" readOnly value={mgbaPath ?? ''} placeholder="No mGBA executable selected" />
            <Button type="button" variant="outline" onClick={onChooseMgba} className="shrink-0 gap-2">
              <FolderOpen className="h-4 w-4" />
              Browse
            </Button>
          </div>
        </div>

        <div className="rounded-md border bg-muted/40 p-4">
          <div className="text-sm font-medium">Distribution policy</div>
          <p className="mt-1 text-sm text-muted-foreground">
            The launcher detects or asks for mGBA in v0.1. Bundling mGBA is kept out of the default path until license and packaging work is explicit.
          </p>
        </div>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <Button type="button" variant="outline" onClick={onOpenDownload} className="gap-2">
          <Download className="h-4 w-4" />
          Download mGBA
        </Button>
        <Button type="button" onClick={onContinue} disabled={!mgbaPath}>
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
};
