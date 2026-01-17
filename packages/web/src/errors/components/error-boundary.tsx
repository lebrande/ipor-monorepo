import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  error: string;
  onRetry: () => void;
}

export const ErrorBoundary = ({ error, onRetry }: Props) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="max-w-md">
        <div className="mb-4">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Something went wrong
        </h3>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={onRetry} className="w-full">
          Try Again
        </Button>
      </div>
    </div>
  );
};
