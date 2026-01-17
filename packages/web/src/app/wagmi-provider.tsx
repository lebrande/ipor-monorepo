import { WagmiProvider, http, createConfig } from 'wagmi';
import { arbitrum, base, mainnet } from 'wagmi/chains';
import z from 'zod';

export const ALLOWED_CHAINS = [mainnet, arbitrum, base] as const;
export const ALLOWED_CHAIN_IDS = [mainnet.id, arbitrum.id, base.id] as const;

export type ChainId = (typeof ALLOWED_CHAIN_IDS)[number];

export const chainIdSchema = z.coerce.number().int().positive();

export const allowedChainIdsSchema = chainIdSchema
  .refine((val) => ALLOWED_CHAIN_IDS.includes(val as ChainId))
  .transform((val) => val as ChainId);

const transports = {
  [mainnet.id]: http(import.meta.env.PUBLIC_VITE_RPC_URL_MAINNET),
  [arbitrum.id]: http(import.meta.env.PUBLIC_VITE_RPC_URL_ARBITRUM),
  [base.id]: http(import.meta.env.PUBLIC_VITE_RPC_URL_BASE),
};

export const config = createConfig({
  chains: ALLOWED_CHAINS,
  transports,
});

export const WagmiProviderWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <WagmiProvider config={config}>{children}</WagmiProvider>;
};
