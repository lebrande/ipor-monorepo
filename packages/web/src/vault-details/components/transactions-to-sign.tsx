import { Card } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface Props {
  message: string;
}

export function TransactionsToSign({ message }: Props) {
  return (
    <Card className="p-4 border-dashed border-2 bg-muted/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">{message}</p>
          <p className="text-xs text-muted-foreground">Placeholder component</p>
        </div>
      </div>
    </Card>
  );
}
