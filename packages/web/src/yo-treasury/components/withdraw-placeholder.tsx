'use client';

import { Card } from '@/components/ui/card';
import { Lock } from 'lucide-react';

export function WithdrawPlaceholder() {
  return (
    <Card className="p-4 opacity-60">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Lock className="w-4 h-4" />
        <span className="text-sm font-medium">Withdraw</span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Withdraw from treasury coming soon.
      </p>
    </Card>
  );
}
