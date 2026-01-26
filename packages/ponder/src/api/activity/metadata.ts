import { Hono } from 'hono';
import { ERC4626_VAULTS } from '../../contracts';
import { chains } from '../../utils/chains';

export const metadata = new Hono();

metadata.get('/metadata', async (c) => {
  // Get unique chains from vaults
  const vaultChainIds = new Set(ERC4626_VAULTS.map((v) => v.chainId));

  // Build chain list with names
  const chainList = chains
    .filter((chain) => vaultChainIds.has(chain.id))
    .map((chain) => ({
      chainId: chain.id,
      name: chain.name,
    }));

  // Build vault list
  const vaultList = ERC4626_VAULTS.map((vault) => ({
    chainId: vault.chainId,
    address: vault.address,
    name: vault.name,
  }));

  return c.json({
    chains: chainList,
    vaults: vaultList,
  });
});
