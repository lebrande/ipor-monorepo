import { cn } from '@/lib/utils';

const PROTOCOL_ICONS: Record<string, { icon: string; label: string }> = {
  // kebab-case keys (from action tools)
  'aave-v3': { icon: '/protocols/aave.svg', label: 'Aave V3' },
  morpho: { icon: '/protocols/morpho-blue.svg', label: 'Morpho' },
  'euler-v2': { icon: '/protocols/euler.svg', label: 'Euler V2' },
  // display-name keys (from getMarketBalancesTool / readVaultBalances)
  'Aave V3': { icon: '/protocols/aave.svg', label: 'Aave V3' },
  'Aave V3 Lido': { icon: '/protocols/aave.svg', label: 'Aave V3 Lido' },
  'Morpho': { icon: '/protocols/morpho-blue.svg', label: 'Morpho' },
  'Euler V2': { icon: '/protocols/euler.svg', label: 'Euler V2' },
};

interface Props {
  protocol: string;
  className?: string;
}

export function ProtocolIcon({ protocol, className }: Props) {
  const config = PROTOCOL_ICONS[protocol];
  if (!config) {
    return (
      <div
        className={cn(
          'w-5 h-5 rounded-full bg-muted text-xs text-muted-foreground flex items-center justify-center',
          className,
        )}
      >
        {protocol.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={config.icon}
      alt={config.label}
      title={config.label}
      className={cn('w-5 h-5 rounded-full', className)}
    />
  );
}

export function getProtocolLabel(protocol: string): string {
  return PROTOCOL_ICONS[protocol]?.label ?? protocol;
}
