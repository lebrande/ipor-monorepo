/**
 * Ponder Database - Drizzle ORM Client
 * 
 * This package provides the Drizzle ORM client for the PONDER database,
 * which stores all blockchain indexed data:
 * - Transfer events
 * - Deposit events
 * - Withdraw events
 * - Vault metrics and aggregations (buckets)
 * - Depositor information
 * 
 * This is SEPARATE from other Supabase databases (e.g., Mastra, app data).
 * 
 * @example
 * ```ts
 * import { db, transferEvent } from '@ipor/fusion-supabase-ponder';
 * 
 * const transfers = await db.select().from(transferEvent).limit(100);
 * ```
 */

export { db, client, getPonderDatabaseInfo } from './client';
export * from './schema';
