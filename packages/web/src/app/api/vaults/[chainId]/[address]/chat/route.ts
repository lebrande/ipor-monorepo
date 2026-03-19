import { NextRequest } from 'next/server';
import { isAddress } from 'viem';
import { toAISdkStream } from '@mastra/ai-sdk';
import { createUIMessageStreamResponse } from 'ai';
import { alphaAgent } from '@ipor/fusion-mastra/agents';
import { getVaultFromRegistry, getChainName } from '@/lib/vaults-registry';
import { isValidChainId } from '@/app/chains.config';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string; address: string }> },
) {
  const { chainId: chainIdStr, address } = await params;
  const chainId = parseInt(chainIdStr, 10);

  if (
    isNaN(chainId) ||
    !isValidChainId(chainId) ||
    !isAddress(address, { strict: false })
  ) {
    return new Response('Invalid parameters', { status: 400 });
  }

  const vault = getVaultFromRegistry(chainId, address);
  const chainName = getChainName(chainId);
  const { messages, callerAddress } = await request.json();

  const callerContext = callerAddress && isAddress(callerAddress, { strict: false })
    ? ` The user's connected wallet (callerAddress for simulation) is ${callerAddress}.`
    : '';
  const vaultContext = `CURRENT VAULT CONTEXT: The user is viewing vault "${vault?.name ?? 'Unknown'}" at address ${address} on ${chainName} (chainId: ${chainId}). When the user asks about "this vault", use this context.${callerContext}`;

  // Use vault address as stable thread/resource IDs for working memory persistence
  const threadId = `vault-${chainId}-${address.toLowerCase()}`;

  try {
    const result = await alphaAgent.stream(messages, {
      maxSteps: 10,
      system: vaultContext,
      memory: {
        thread: threadId,
        resource: threadId,
      },
    });

    const stream = toAISdkStream(result, { from: 'agent' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createUIMessageStreamResponse({ stream: stream as any });
  } catch (error) {
    console.error('Error in agent stream', error);
    return new Response('An error occurred while processing your request.', {
      status: 500,
    });
  }
}
