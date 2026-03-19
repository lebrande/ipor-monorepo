import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability';
import { chatRoute } from '@mastra/ai-sdk';
import { sqlAgent } from '../agents/sql-agent';
import { plasmaVaultAgent } from '../agents/plasma-vault-agent';
import { alphaAgent } from '../agents/alpha-agent';
import { yoTreasuryAgent } from '../agents/yo-treasury-agent';
import { databaseQueryWorkflow } from '../workflows/database-query-workflow';

export const mastra = new Mastra({
  workflows: { databaseQueryWorkflow },
  agents: { sqlAgent, plasmaVaultAgent, alphaAgent, yoTreasuryAgent },
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: "file:./mastra.db",
  }),
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
