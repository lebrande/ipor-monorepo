/**
 * Drizzle Kit Configuration
 * 
 * Used for generating migrations and managing database schema.
 * Note: Ponder manages its own schema, so this is mainly for introspection.
 */

import type { Config } from 'drizzle-kit';
import 'dotenv/config';

const connectionString = process.env.PONDER_DB_DATABASE_URL || process.env.PONDER_DATABASE_URL;

if (!connectionString) {
  throw new Error('Missing PONDER_DB_DATABASE_URL or PONDER_DATABASE_URL environment variable');
}

export default {
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString,
  },
} satisfies Config;
