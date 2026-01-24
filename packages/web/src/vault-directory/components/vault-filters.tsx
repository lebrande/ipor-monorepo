import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import type { NetFlowOption } from '@/vault-directory/vault-directory.types';
import { useVaultDirectoryContext } from '@/vault-directory/vault-directory.context';
import { NetFlowFilter } from '@/vault-directory/components/filters/net-flow-filter';
import { TVLRangeFilter } from '@/vault-directory/components/filters/tvl-range-filter';
import { DepositorCountFilter } from '@/vault-directory/components/filters/depositor-count-filter';
import { UnderlyingAssetFilter } from '@/vault-directory/components/filters/underlying-asset-filter';
import { ChainFilter } from '@/vault-directory/components/filters/chain-filter';
import { ProtocolFilter } from '@/vault-directory/components/filters/protocol-filter';

export const VaultFilters = () => {
  const { filters, metadata, isFiltersActive, filterActions } =
    useVaultDirectoryContext();

  // Default max values if metadata not loaded
  const maxTvl = metadata?.ranges.tvl.max ?? 1_000_000_000;
  const maxDepositors = metadata?.ranges.depositors.max ?? 10_000;
  const availableAssets = metadata?.assets.map((a) => a.symbol) ?? [];
  const availableChains = metadata?.chains ?? [];
  const availableProtocols = metadata?.protocols ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>

      <CardContent>
        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {/* TVL Range Filter */}
          <div className="space-y-6">
            <Label>TVL Range (USD)</Label>
            <TVLRangeFilter
              value={filters.tvlRange}
              onChange={(range) => filterActions.updateTVLRange(range)}
              max={maxTvl}
            />
          </div>

          {/* Depositor Count Filter */}
          <div className="space-y-6">
            <Label>Depositor Count</Label>
            <DepositorCountFilter
              value={filters.depositorRange}
              onChange={(range) => filterActions.updateDepositorRange(range)}
              max={maxDepositors}
            />
          </div>

          {/* Net Flow Filter */}
          <div className="space-y-2">
            <Label>Net Flow (7d)</Label>
            <NetFlowFilter
              value={filters.netFlow}
              onChange={(option: NetFlowOption) =>
                filterActions.updateNetFlow(option)
              }
            />
          </div>

          {/* Underlying Assets Filter */}
          <div className="space-y-2">
            <Label>Underlying Assets</Label>
            <UnderlyingAssetFilter
              value={filters.underlyingAssets}
              onChange={(assets) => filterActions.updateUnderlyingAssets(assets)}
              options={availableAssets}
            />
          </div>

          {/* Chain Filter */}
          <div className="space-y-2">
            <Label>Chains</Label>
            <ChainFilter
              value={filters.chains}
              onChange={(chains) => filterActions.updateChains(chains)}
              options={availableChains}
            />
          </div>

          {/* Protocol Filter */}
          <div className="space-y-2">
            <Label>Protocols</Label>
            <ProtocolFilter
              value={filters.protocols}
              onChange={(protocols) => filterActions.updateProtocols(protocols)}
              options={availableProtocols}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex justify-end w-full">
          <Button
            variant="outline"
            onClick={filterActions.clearFilters}
            disabled={!isFiltersActive}
            className="text-sm"
          >
            Clear All Filters
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
