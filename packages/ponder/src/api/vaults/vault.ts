import { Hono } from 'hono';
import { validateSmartContractParams } from '../../utils/validate-smart-contract-params';

export const vault = new Hono();

vault.get('/:chainId/:vaultAddress', (c) => {
  const params = validateSmartContractParams({
    chainId: c.req.param('chainId'),
    address: c.req.param('vaultAddress'),
  });

  if (params.type === 'error') {
    return c.json({ error: params.message }, 400);
  }

  const { chainId, address } = params;

  return c.json({
    chainId,
    address,
    name: 'Example Vault',
    protocol: 'Example Protocol',
    tvl: 1000000,
    underlyingAsset: 'Example Asset',
    underlyingAssetAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    depositorCount: 444,
    allTimeDepositors: 8888,
    netFlow7d: 1943,
    creationDate: new Date('2024-01-01'),
    sharePrice: 1.1,
    vaultAge: 100,
  });
});
