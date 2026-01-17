import { arbitrum, base, mainnet, unichain } from 'viem/chains';
import { z } from 'zod';

export const chains = [mainnet, arbitrum, base, unichain] as const;

export const chainIdSchema = z.union(
  chains.map((chain) => z.literal(chain.id)),
);

export type ChainId = z.infer<typeof chainIdSchema>;
