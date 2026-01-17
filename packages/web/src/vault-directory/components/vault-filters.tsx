import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import type {
  VaultFilters as VaultFiltersType,
  NetFlowOption,
} from '@/vault-directory/vault-directory.types';
import { useVaultDirectoryContext } from '@/vault-directory/vault-directory.context';
import { NetFlowFilter } from '@/vault-directory/components/filters/net-flow-filter';
import { TVLRangeFilter } from '@/vault-directory/components/filters/tvl-range-filter';
import { DepositorCountFilter } from '@/vault-directory/components/filters/depositor-count-filter';
import { UnderlyingAssetFilter } from '@/vault-directory/components/filters/underlying-asset-filter';

export const VaultFilters = () => {
  const { filters, availableAssets, isFiltersActive, filterActions } =
    useVaultDirectoryContext();

  const handleFiltersChange = (newFilters: VaultFiltersType) => {
    filterActions.updateTVLRange(newFilters.tvlRange);
    filterActions.updateDepositorRange(newFilters.depositorRange);
    filterActions.updateNetFlow(newFilters.netFlow);
    filterActions.updateUnderlyingAssets(newFilters.underlyingAssets);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>

      <CardContent>
        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* TVL Range Filter */}
          <div className="space-y-6">
            <Label>TVL Range (USD)</Label>
            <TVLRangeFilter
              value={filters.tvlRange}
              onChange={(range) =>
                handleFiltersChange({ ...filters, tvlRange: range })
              }
            />
          </div>

          {/* Depositor Count Filter */}
          <div className="space-y-2">
            <Label>Depositor Count</Label>
            <DepositorCountFilter
              value={filters.depositorRange}
              onChange={(range) =>
                handleFiltersChange({ ...filters, depositorRange: range })
              }
            />
          </div>

          {/* Net Flow Filter */}
          <div className="space-y-2">
            <Label>Net Flow (7d)</Label>
            <NetFlowFilter
              value={filters.netFlow}
              onChange={(option: NetFlowOption) =>
                handleFiltersChange({ ...filters, netFlow: option })
              }
            />
          </div>

          {/* Underlying Assets Filter */}
          <div className="space-y-2">
            <Label>Underlying Assets</Label>
            <UnderlyingAssetFilter
              value={filters.underlyingAssets}
              onChange={(assets) =>
                handleFiltersChange({ ...filters, underlyingAssets: assets })
              }
              options={
                availableAssets?.assets.map((asset: any) => asset.symbol) || []
              }
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
