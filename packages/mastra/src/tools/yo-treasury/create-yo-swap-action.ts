import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { type Address, type Hex, encodeFunctionData, erc20Abi } from 'viem';
import {
  yoUniversalTokenSwapperFuseAbi,
  UNIVERSAL_TOKEN_SWAPPER_FUSE_ADDRESS,
} from '@ipor/fusion-sdk';
import { simulateOnFork } from '../alpha/simulate-on-fork';

const existingActionSchema = z.object({
  id: z.string(),
  fuseActions: z.array(z.object({ fuse: z.string(), data: z.string() })),
});

/** Call Odos quote + assemble APIs to get swap calldata */
async function getOdosSwapCalldata(params: {
  chainId: number;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippageLimitPercent?: number;
  userAddr: string;
}): Promise<{
  routerAddress: string;
  swapCalldata: string;
  amountOut: string;
  gasEstimate: number;
}> {
  const quoteResponse = await fetch('https://api.odos.xyz/sor/quote/v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chainId: params.chainId,
      inputTokens: [{ tokenAddress: params.tokenIn, amount: params.amountIn }],
      outputTokens: [{ tokenAddress: params.tokenOut, proportion: 1 }],
      slippageLimitPercent: params.slippageLimitPercent ?? 0.5,
      userAddr: params.userAddr,
    }),
  });

  if (!quoteResponse.ok) {
    throw new Error(`Odos quote failed: ${quoteResponse.status} ${await quoteResponse.text()}`);
  }

  const quote = await quoteResponse.json();

  const assembleResponse = await fetch('https://api.odos.xyz/sor/assemble', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userAddr: params.userAddr,
      pathId: quote.pathId,
      simulate: false,
    }),
  });

  if (!assembleResponse.ok) {
    throw new Error(`Odos assemble failed: ${assembleResponse.status} ${await assembleResponse.text()}`);
  }

  const assembled = await assembleResponse.json();

  return {
    routerAddress: assembled.transaction.to,
    swapCalldata: assembled.transaction.data,
    amountOut: quote.outAmounts?.[0] ?? '0',
    gasEstimate: quote.gasEstimate ?? 0,
  };
}

export const createYoSwapActionTool = createTool({
  id: 'create-yo-swap-action',
  description: `Create a fuse action to swap tokens via the UniversalTokenSwapperFuse using Odos aggregator.
Use this when the user wants to swap assets (e.g., "Swap 500 USDC to WETH").
The swap executes through the Odos router via the vault's SwapExecutor.
Auto-simulates all pending actions on an Anvil fork.`,
  inputSchema: z.object({
    vaultAddress: z.string().describe('Treasury PlasmaVault address'),
    chainId: z.number().describe('Chain ID (8453 for Base)'),
    tokenIn: z.string().describe('Address of token to sell'),
    tokenOut: z.string().describe('Address of token to buy'),
    amountIn: z.string().describe('Amount to swap in smallest unit'),
    executorAddress: z.string().describe('SwapExecutor contract address'),
    callerAddress: z.string().optional(),
    existingPendingActions: z.array(existingActionSchema).optional(),
  }),
  outputSchema: z.object({
    type: z.literal('action-with-simulation'),
    success: z.boolean(),
    protocol: z.string(),
    actionType: z.string(),
    description: z.string(),
    fuseActions: z.array(z.object({ fuse: z.string(), data: z.string() })),
    error: z.string().optional(),
    simulation: z.any().optional(),
  }),
  execute: async ({ vaultAddress, chainId, tokenIn, tokenOut, amountIn, executorAddress, callerAddress, existingPendingActions }) => {
    try {
      const odos = await getOdosSwapCalldata({
        chainId,
        tokenIn,
        tokenOut,
        amountIn,
        userAddr: executorAddress,
      });

      const targets: Address[] = [
        tokenIn as Address,
        odos.routerAddress as Address,
      ];
      const swapData: Hex[] = [
        encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [odos.routerAddress as Address, BigInt(amountIn)],
        }),
        odos.swapCalldata as Hex,
      ];

      const fuseCalldata = encodeFunctionData({
        abi: yoUniversalTokenSwapperFuseAbi,
        functionName: 'enter',
        args: [{
          tokenIn: tokenIn as Address,
          tokenOut: tokenOut as Address,
          amountIn: BigInt(amountIn),
          data: { targets, data: swapData },
        }],
      });

      const swapFuseAddress = UNIVERSAL_TOKEN_SWAPPER_FUSE_ADDRESS[chainId as keyof typeof UNIVERSAL_TOKEN_SWAPPER_FUSE_ADDRESS];
      if (!swapFuseAddress) throw new Error(`Swap fuse not configured for chain ${chainId}`);

      const newFuseActions = [{ fuse: swapFuseAddress, data: fuseCalldata }];
      const description = `Swap ${amountIn} ${tokenIn} → ${tokenOut} via Odos (expected out: ${odos.amountOut})`;

      let simulation;
      if (callerAddress) {
        const existingFuseActions = (existingPendingActions ?? []).flatMap(a => a.fuseActions);
        const allFuseActions = [...existingFuseActions, ...newFuseActions];
        const simResult = await simulateOnFork({
          vaultAddress,
          chainId,
          callerAddress,
          flatFuseActions: allFuseActions,
        });
        simulation = {
          ...simResult,
          actionsCount: (existingPendingActions?.length ?? 0) + 1,
        };
      }

      return {
        type: 'action-with-simulation' as const,
        success: true,
        protocol: 'yo-swap',
        actionType: 'swap',
        description,
        fuseActions: newFuseActions,
        simulation,
      };
    } catch (error) {
      return {
        type: 'action-with-simulation' as const,
        success: false,
        protocol: 'yo-swap',
        actionType: 'swap',
        description: 'Failed: swap via Odos',
        fuseActions: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
