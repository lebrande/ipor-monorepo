import { type Address, isAddress } from 'viem';
import { z } from 'zod';
import plasmaVaultsJson from '../../../../plasma-vaults.json';

const addressSchema = z.custom<Address>(
  (address) => isAddress(address as string, { strict: false }),
  { message: 'Invalid address' },
);

const vaultSchema = z.object({
  name: z.string(),
  address: addressSchema,
  chainId: z.number(),
  protocol: z.string(),
  tags: z.array(z.string()),
  startBlock: z.number(),
  url: z.url(),
});

const vaultsSchema = z.array(vaultSchema);

export interface ParsedVault {
  name: string;
  address: Address;
  chainId: number;
  protocol: string;
  tags: string[];
  startBlock: number;
  url: string;
}

const parseVaults = (): ParsedVault[] => {
  const vaults = vaultsSchema.parse(plasmaVaultsJson.vaults);
  return vaults.map((vault) => ({
    ...vault,
    address: vault.address as Address,
  }));
};

export const ERC4626_VAULTS = parseVaults();

// Build lookup map once at module level for O(1) lookups
const VAULT_LOOKUP = new Map<string, ParsedVault>();
for (const vault of ERC4626_VAULTS) {
  VAULT_LOOKUP.set(
    `${vault.chainId}:${vault.address.toLowerCase()}`,
    vault,
  );
}

export function getVaultFromRegistry(
  chainId: number,
  address: string,
): ParsedVault | undefined {
  return VAULT_LOOKUP.get(`${chainId}:${address.toLowerCase()}`);
}

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  42161: 'Arbitrum',
  8453: 'Base',
  43114: 'Avalanche',
  130: 'Unichain',
  9745: 'Plasma',
};

export const getChainName = (chainId: number): string => {
  return CHAIN_NAMES[chainId] || `Chain ${chainId}`;
};
