import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { VercelDeployer } from '@mastra/deployer-vercel';
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability';
import { chatRoute } from '@mastra/ai-sdk';
import { sqlAgent } from '../agents/sql-agent';
import { plasmaVaultAgent } from '../agents/plasma-vault-agent';
import { alphaAgent } from '../agents/alpha-agent';
import { yoTreasuryAgent } from '../agents/yo-treasury-agent';
import { databaseQueryWorkflow } from '../workflows/database-query-workflow';
import { createStorage } from '../storage';

export const mastra = new Mastra({
  workflows: { databaseQueryWorkflow },
  agents: { sqlAgent, plasmaVaultAgent, alphaAgent, yoTreasuryAgent },
  deployer: new VercelDeployer({
    regions: ['fra1'],
    maxDuration: 60,
  }),
  storage: createStorage('mastra-storage'),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new DefaultExporter(),
          new CloudExporter(),
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(),
        ],
      },
    },
  }),
  server: {
    cors: {
      origin: '*',
      allowMethods: ['*'],
      allowHeaders: ['*'],
    },
    apiRoutes: [
      chatRoute({
        path: '/chat/:agentId',
      }),
    ],
  },
});
