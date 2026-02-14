'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ListTodo,
} from 'lucide-react';
import type { PendingActionsOutput } from '@ipor/fusion-mastra/alpha-types';

type PendingAction = PendingActionsOutput['actions'][number];

const PROTOCOL_LABELS: Record<string, string> = {
  'aave-v3': 'Aave V3',
  morpho: 'Morpho',
  'euler-v2': 'Euler V2',
};

const ACTION_ICONS: Record<string, typeof ArrowUpRight> = {
  supply: ArrowUpRight,
  withdraw: ArrowDownLeft,
  borrow: ArrowUpRight,
  repay: ArrowDownLeft,
};

function ActionItem({ action }: { action: PendingAction }) {
  const [showPayload, setShowPayload] = useState(false);
  const [copied, setCopied] = useState(false);
  const Icon = ACTION_ICONS[action.actionType] ?? ArrowUpRight;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(
      JSON.stringify(action.fuseActions, null, 2),
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{action.description}</p>
            <p className="text-xs text-muted-foreground">
              {PROTOCOL_LABELS[action.protocol] ?? action.protocol} &middot;{' '}
              {action.actionType}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowPayload(!showPayload)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {showPayload ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        Raw payload
      </button>

      {showPayload && (
        <div className="relative">
          <pre className="text-xs bg-muted rounded p-2 overflow-auto max-h-32">
            {JSON.stringify(action.fuseActions, null, 2)}
          </pre>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="w-3 h-3" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

interface Props {
  actions: PendingAction[];
  message: string;
}

export function PendingActionsList({ actions, message }: Props) {
  if (actions.length === 0) {
    return (
      <Card className="p-4 border-dashed border-2 bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ListTodo className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{message}</p>
            <p className="text-xs text-muted-foreground">No actions queued</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ListTodo className="w-4 h-4 text-primary" />
        <p className="text-sm font-medium">{message}</p>
      </div>
      <div className="space-y-2">
        {actions.map((action) => (
          <ActionItem key={action.id} action={action} />
        ))}
      </div>
    </Card>
  );
}
