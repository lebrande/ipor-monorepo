import { ERC4626_VAULTS } from '../contracts';

export const VAULTS_LIST = ERC4626_VAULTS.map((vault) => {
  return {
    ...vault,
    tvl: 0,
    underlyingAsset: 'USDC',
    underlyingAssetAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    depositorCount: 0,
    netFlow7d: 0,
    creationDate: '2025-01-01',
    sharePrice: 0,
  };
});
