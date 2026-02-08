import { NextRequest } from 'next/server';
import { isAddress } from 'viem';
import { plasmaVaultAgent } from '@ipor/fusion-mastra/agents';
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
  const { messages } = await request.json();

  const vaultContext = `CURRENT VAULT CONTEXT: The user is viewing vault "${vault?.name ?? 'Unknown'}" at address ${address} on ${chainName} (chainId: ${chainId}). When the user asks about "this vault", "the vault", or asks questions without specifying a vault, use chainId=${chainId} and vaultAddress="${address}" with your tools.`;

  const messagesWithContext = [
    { role: 'system' as const, content: vaultContext },
    ...messages,
  ];

  try {
    const result = await plasmaVaultAgent.stream(messagesWithContext, {
      maxSteps: 5,
      maxTokens: 4096,
    });

    // Encode the text stream to bytes for the Response
    const encoder = new TextEncoder();
    const encodedStream = result.textStream.pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          controller.enqueue(encoder.encode(chunk));
        },
      }),
    );

    return new Response(encodedStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('Error in agent stream', error);
    return new Response('An error occurred while processing your request.', {
      status: 500,
    });
  }
}
