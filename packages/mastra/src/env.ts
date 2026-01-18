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
   * OpenAI model to use for the SQL Agent
   * Defaults to 'openai/gpt-4.1-mini' if not specified
   */
  MODEL: z.string().optional().default('openai/gpt-4.1-mini'),
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
