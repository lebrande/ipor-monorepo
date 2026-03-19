import { NextRequest } from 'next/server';
import { isAddress } from 'viem';
import { toAISdkStream } from '@mastra/ai-sdk';
import { createUIMessageStreamResponse } from 'ai';
import { yoTreasuryAgent } from '@ipor/fusion-mastra/agents';

export async function POST(request: NextRequest) {
  const { messages, callerAddress, vaultAddress, chainId } = await request.json();

  const callerContext =
    callerAddress && isAddress(callerAddress, { strict: false })
      ? ` The user's connected wallet (callerAddress for simulation) is ${callerAddress}.`
      : '';

  const vaultContext =
    vaultAddress && isAddress(vaultAddress, { strict: false })
      ? ` The user's treasury vault address is ${vaultAddress} on chainId ${chainId}.`
      : ' The user has not created a treasury vault yet.';

  const system = `CURRENT CONTEXT:${callerContext}${vaultContext} Chain: ${chainId ?? 8453} (Base).`;

  const threadId = callerAddress
    ? `yo-treasury-${callerAddress.toLowerCase()}`
    : 'yo-treasury-anonymous';

  try {
    const result = await yoTreasuryAgent.stream(messages, {
      maxSteps: 10,
      system,
      memory: {
        thread: threadId,
        resource: threadId,
      },
    });

    const stream = toAISdkStream(result, { from: 'agent' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createUIMessageStreamResponse({ stream: stream as any });
  } catch (error) {
    console.error('Error in yo-treasury agent stream', error);
    return new Response('An error occurred while processing your request.', {
      status: 500,
    });
  }
}
