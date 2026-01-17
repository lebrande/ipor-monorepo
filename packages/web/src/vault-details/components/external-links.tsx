import { ExternalLink, Globe, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  generateExplorerUrl,
  generateDebankUrl,
} from '@/vault-details/vault-details.utils';
import type { VaultParams } from '@/app/app.types';
import { truncateHex } from '@/lib/truncate-hex';

interface Props extends VaultParams {}

export const ExternalLinks = ({ vaultAddress, chainId }: Props) => {
  // Generate URLs if not provided
  const explorerLink = generateExplorerUrl({ vaultAddress, chainId });
  const debankLink = generateDebankUrl(vaultAddress);

  const links = [
    {
      name: 'Block Explorer',
      url: explorerLink,
      icon: Globe,
      description: 'View contract on blockchain explorer',
      primary: true,
    },
    {
      name: 'DeBank',
      url: debankLink,
      icon: TrendingUp,
      description: 'Analyze on DeBank',
      primary: false,
    },
  ];

  const handleLinkClick = (url: string, name: string) => {
    // Track analytics if needed
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="w-5 h-5" />
          External Links
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {links.map((link) => {
            const Icon = link.icon;

            return (
              <Button
                key={link.name}
                variant={link.primary ? 'default' : 'outline'}
                onClick={() => handleLinkClick(link.url, link.name)}
                className="flex items-center gap-2 h-auto p-4 justify-start"
              >
                <Icon className="w-4 h-4" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">{link.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {link.description}
                  </span>
                </div>
                <ExternalLink className="w-3 h-3 ml-auto" />
              </Button>
            );
          })}
        </div>

        {/* Additional info */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Vault Address:</strong>
          </p>
          <p className="text-sm font-mono text-foreground break-all">
            {truncateHex(vaultAddress, 6)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            <strong>Chain ID:</strong> {chainId}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
