'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { SendHorizontal, Bot, User, Loader2 } from 'lucide-react';
import { TransactionsToSign } from './transactions-to-sign';
import type { ChainId } from '@/app/chains.config';
import type { Address } from 'viem';

interface Props {
  chainId: ChainId;
  vaultAddress: Address;
}

export function VaultAskAi({ chainId, vaultAddress }: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/vaults/${chainId}/${vaultAddress}/chat`,
    }),
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    sendMessage({ text: inputValue });
    setInputValue('');
  };

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <Bot className="w-8 h-8" />
            <p>Ask anything about this vault</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3 text-sm',
              message.role === 'user' ? 'justify-end' : 'justify-start',
            )}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className="max-w-[80%] space-y-2">
              {message.parts.map((part, index) => {
                if (part.type === 'text') {
                  if (!part.text) return null;
                  return (
                    <div
                      key={index}
                      className={cn(
                        'rounded-lg px-3 py-2 whitespace-pre-wrap',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted',
                      )}
                    >
                      {part.text}
                    </div>
                  );
                }

                if (
                  part.type === 'tool-displayTransactionsTool'
                ) {
                  if (part.state === 'output-available') {
                    const output = part.output as {
                      message: string;
                    };
                    return (
                      <TransactionsToSign
                        key={index}
                        message={output.message}
                      />
                    );
                  }
                  if (
                    part.state === 'input-available' ||
                    part.state === 'input-streaming'
                  ) {
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-muted-foreground"
                      >
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading transactions...</span>
                      </div>
                    );
                  }
                  return null;
                }

                return null;
              })}
            </div>
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
        {error && (
          <div className="text-sm text-destructive text-center">
            Something went wrong. Please try again.
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleFormSubmit} className="border-t p-4 flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask about this vault..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button
          type="submit"
          size="icon"
          disabled={isLoading || !inputValue.trim()}
        >
          <SendHorizontal className="w-4 h-4" />
        </Button>
      </form>
    </Card>
  );
}
