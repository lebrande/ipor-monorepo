import { type Address, type Hex } from 'viem';
import { SUPPORTED_CHAINS } from '../plasma-vault/utils/viem-clients';
import { readVaultBalances } from './read-vault-balances';
import { spawnAnvilFork } from './anvil-fork';
import type { BalanceSnapshot } from './types';

/** Minimal ABI for PlasmaVault.execute(FuseAction[]) */
const plasmaVaultExecuteAbi = [
  {
    type: 'function',
    name: 'execute',
    inputs: [
      {
        name: 'calls_',
        type: 'tuple[]',
        internalType: 'struct FuseAction[]',
        components: [
          { name: 'fuse', type: 'address', internalType: 'address' },
          { name: 'data', type: 'bytes', internalType: 'bytes' },
        ],
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

export interface SimulationInput {
  vaultAddress: string;
  chainId: number;
  callerAddress: string;
  flatFuseActions: Array<{ fuse: string; data: string }>;
}

export interface SimulationOutput {
  success: boolean;
  message: string;
  actionsCount: number;
  fuseActionsCount: number;
  balancesBefore?: BalanceSnapshot;
  balancesAfter?: BalanceSnapshot;
  error?: string;
}

/**
 * Simulate fuse actions on an Anvil fork.
 * Reads balances before and after execution.
 * No eth_call fallback — Anvil only.
 */
export async function simulateOnFork(input: SimulationInput): Promise<SimulationOutput> {
  const { vaultAddress, chainId, callerAddress, flatFuseActions } = input;

  if (flatFuseActions.length === 0) {
    return {
      success: false,
      message: 'No fuse actions to simulate',
      actionsCount: 0,
      fuseActionsCount: 0,
    };
  }

  let fork: Awaited<ReturnType<typeof spawnAnvilFork>> | null = null;

  try {
    fork = await spawnAnvilFork(chainId);

    const balancesBefore = await readVaultBalances(
      fork.publicClient,
      vaultAddress as Address,
    );

    await fork.impersonateAndFund(callerAddress as Address);

    const walletClient = fork.createImpersonatedWalletClient(callerAddress as Address);
    const hash = await walletClient.writeContract({
      account: callerAddress as Address,
      chain: SUPPORTED_CHAINS[chainId],
      address: vaultAddress as Address,
      abi: plasmaVaultExecuteAbi,
      functionName: 'execute',
      args: [flatFuseActions.map(a => ({
        fuse: a.fuse as Address,
        data: a.data as Hex,
      }))],
    });

    await fork.publicClient.waitForTransactionReceipt({ hash });

    const balancesAfter = await readVaultBalances(
      fork.publicClient,
      vaultAddress as Address,
    );

    return {
      success: true,
      message: `Simulation successful — ${flatFuseActions.length} fuse action${flatFuseActions.length === 1 ? '' : 's'} executed on fork.`,
      actionsCount: 0, // caller sets this
      fuseActionsCount: flatFuseActions.length,
      balancesBefore,
      balancesAfter,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Simulation failed: ${errorMessage}`,
      actionsCount: 0,
      fuseActionsCount: flatFuseActions.length,
      error: errorMessage,
    };
  } finally {
    fork?.kill();
  }
}
