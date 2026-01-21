import { z } from 'zod';

/**
 * Environment variables schema for Mastra package
 *
 * Validates required environment variables at startup.
 * If validation fails, the application will throw a descriptive error.
 */
const envSchema = z.object({
  /**
   * Fusion Ponder PostgreSQL database connection URL
   * Used by SQL Agent tools for database introspection and querying
   *
   * Example: postgresql://postgres:postgres@127.0.0.1:54342/postgres
   */
  PONDER_DATABASE_URL: z
    .string({
      required_error: 'PONDER_DATABASE_URL environment variable is required for Fusion Ponder database connection',
    })
    .url('PONDER_DATABASE_URL must be a valid PostgreSQL connection URL'),

  /**
   * Model to use for agents
   * Defaults to 'openrouter/anthropic/claude-3-5-haiku-20241022' (Claude Haiku 4.5)
   * This model handles parallel tool calls excellently
   */
  MODEL: z.string().optional().default('openrouter/anthropic/claude-3-5-haiku-20241022'),

  /**
   * RPC URLs for blockchain connections
   * Used by Plasma Vault Agent tools for on-chain data fetching
   */
  ETHEREUM_RPC_URL: z.string().url().optional(),
  ARBITRUM_RPC_URL: z.string().url().optional(),
  BASE_RPC_URL: z.string().url().optional(),
});

/**
 * Validated environment variables
 *
 * @throws {ZodError} If required environment variables are missing or invalid
 */
export const env = envSchema.parse(process.env);

/**
 * Fusion Ponder database connection string
 * Pre-validated PostgreSQL connection URL for the Fusion blockchain indexing database
 */
export const FUSION_PONDER_CONNECTION_STRING = env.PONDER_DATABASE_URL;

/**
 * RPC URL configuration by chain ID
 */
export const RPC_URLS: Record<number, string | undefined> = {
  1: env.ETHEREUM_RPC_URL, // Ethereum Mainnet
  42161: env.ARBITRUM_RPC_URL, // Arbitrum One
  8453: env.BASE_RPC_URL, // Base
};
