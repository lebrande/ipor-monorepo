/**
 * Ponder Database Drizzle Client
 * 
 * Connects to the Ponder Supabase database using Drizzle ORM.
 * Uses PONDER_DB_* prefixed environment variables to avoid conflicts with other databases.
 * 
 * Based on: https://supabase.com/docs/guides/database/drizzle
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Validate environment variables
// Uses PONDER_DB_* prefix to distinguish from other Supabase instances
let connectionString = process.env.PONDER_DB_DATABASE_URL || process.env.PONDER_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'Missing Ponder Database connection string.\n' +
    'Please set PONDER_DB_DATABASE_URL or PONDER_DATABASE_URL environment variable.\n\n' +
    'For local development with Supabase:\n' +
    '  PONDER_DB_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54332/postgres\n\n' +
    'Or use the connection pooler:\n' +
    '  PONDER_DB_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54339/postgres\n\n' +
    'See: packages/supabase-ponder/README.md for setup instructions.'
  );
}

// Handle Docker resolver for local Supabase (from Supabase docs)
if (connectionString.includes('postgres:postgres@supabase_db_')) {
  const url = new URL(connectionString);
  const hostname = url.hostname;
  if (hostname.includes('_')) {
    url.hostname = hostname.split('_')[1];
    connectionString = url.href;
  }
}

// Disable prefetch as it is not supported for "Transaction" pool mode
// This is required when using Supabase connection pooler
export const client = postgres(connectionString, { prepare: false });

/**
 * Drizzle database client for the Ponder database
 * Includes schema for type-safe queries
 */
export const db = drizzle(client, { schema });

/**
 * Get the Ponder database connection details
 * Useful for debugging and logging
 */
export const getPonderDatabaseInfo = () => {
  const url = new URL(connectionString);
  return {
    host: url.hostname,
    port: url.port,
    database: url.pathname.replace('/', ''),
    isLocal: url.hostname === '127.0.0.1' || url.hostname === 'localhost',
  };
};
