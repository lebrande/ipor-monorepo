import { spawn, type ChildProcess } from 'child_process';
import { createServer } from 'net';
import {
  createPublicClient,
  createTestClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Address,
} from 'viem';
import { SUPPORTED_CHAINS } from '../plasma-vault/utils/viem-clients';
import { RPC_URLS } from '../../env';

/** Result of spawning an Anvil fork */
export interface AnvilFork {
  publicClient: PublicClient;
  impersonateAndFund: (address: Address) => Promise<void>;
  createImpersonatedWalletClient: (account: Address) => WalletClient;
  kill: () => void;
  port: number;
}

/** Find a random available port */
function getRandomPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        const port = addr.port;
        server.close(() => resolve(port));
      } else {
        reject(new Error('Failed to get port'));
      }
    });
  });
}

/** Wait for Anvil to be ready by polling the RPC endpoint */
async function waitForReady(port: number, timeoutMs = 15_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'net_version', params: [], id: 1 }),
      });
      if (res.ok) return;
    } catch {
      // Not ready yet
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Anvil did not start within ${timeoutMs}ms`);
}

/**
 * Spawn an Anvil fork of the given chain.
 * Returns clients and a kill function for cleanup.
 */
export async function spawnAnvilFork(chainId: number): Promise<AnvilFork> {
  const chain = SUPPORTED_CHAINS[chainId];
  if (!chain) throw new Error(`Unsupported chain ID: ${chainId}`);

  const rpcUrl = RPC_URLS[chainId];
  if (!rpcUrl) throw new Error(`No RPC URL for chain ${chainId}`);

  const port = await getRandomPort();

  const anvil: ChildProcess = spawn('anvil', [
    '--fork-url', rpcUrl,
    '--port', String(port),
    '--silent',
    '--no-rate-limit',
  ], { stdio: 'ignore' });

  const kill = () => {
    try { anvil.kill('SIGTERM'); } catch {}
  };

  try {
    await waitForReady(port);
  } catch (err) {
    kill();
    throw err;
  }

  const transport = http(`http://127.0.0.1:${port}`);

  const testClient = createTestClient({ chain, transport, mode: 'anvil' });

  return {
    publicClient: createPublicClient({ chain, transport }),
    impersonateAndFund: async (address: Address) => {
      await testClient.impersonateAccount({ address });
      await testClient.setBalance({ address, value: 10n * 10n ** 18n });
    },
    createImpersonatedWalletClient: (account: Address) =>
      createWalletClient({ chain, account, transport }),
    kill,
    port,
  };
}
