import { ArrowLeft, ExternalLink, Play } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface PlayScreenProps {
  patchedRomPath: string | null;
  mgbaPath: string | null;
  onBack: () => void;
}

export const PlayScreen = ({ patchedRomPath, mgbaPath, onBack }: PlayScreenProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Play</CardTitle>
      <CardDescription>Launch behavior is stubbed until the mGBA milestone.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-5">
      <Alert>
        <Play className="h-4 w-4" />
        <AlertTitle>Native emulator flow</AlertTitle>
        <AlertDescription>The launcher will start mGBA with the patched ROM when v0.3 is implemented.</AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border bg-card p-4">
          <div className="text-sm font-medium">Patched ROM</div>
          <div className="mt-2 truncate text-sm text-muted-foreground">{patchedRomPath ?? 'Not prepared'}</div>
        </div>
        <div className="rounded-md border bg-card p-4">
          <div className="text-sm font-medium">mGBA</div>
          <div className="mt-2 truncate text-sm text-muted-foreground">{mgbaPath ?? 'Not configured'}</div>
        </div>
      </div>
    </CardContent>
    <CardFooter className="justify-between gap-3">
      <Button type="button" variant="outline" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <Button type="button" disabled className="gap-2">
        <ExternalLink className="h-4 w-4" />
        Launch mGBA
      </Button>
    </CardFooter>
  </Card>
);
