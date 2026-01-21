import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { PinoLogger } from '@mastra/loggers';
import { sqlAgent } from '../agents/sql-agent';
import { plasmaVaultAgent } from '../agents/plasma-vault-agent';
import { databaseQueryWorkflow } from '../workflows/database-query-workflow';

export const mastra = new Mastra({
  agents: { sqlAgent, plasmaVaultAgent },
  workflows: {
    databaseQueryWorkflow,
  },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ':memory:',
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: {
    default: {
      enabled: true,
    },
  },
});
