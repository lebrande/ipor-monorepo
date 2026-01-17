import { useVaultContext } from '@/vault/vault.context';
import { VaultMetrics } from '@/vault-metrics/vault-metrics';
import { FlowChart } from '@/flow-chart/flow-chart';
import { ExternalLinks } from '@/vault-details/components/external-links';

export const VaultOverview = () => {
  const { vaultAddress, chainId } = useVaultContext();

  return (
    <div className="space-y-6">
      <VaultMetrics />
      <FlowChart />
      <ExternalLinks vaultAddress={vaultAddress} chainId={chainId} />
    </div>
  );
};
