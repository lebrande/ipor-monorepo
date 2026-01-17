/**
 * Drizzle Schema for Ponder Database
 * 
 * This schema mirrors the tables defined in packages/ponder/ponder.schema.ts
 * It provides type-safe access to the Ponder indexed blockchain data.
 * 
 * Tables are automatically created by Ponder when indexing starts.
 */

import { pgTable, text, integer, bigint, primaryKey } from 'drizzle-orm/pg-core';

// Transfer Events
export const transferEvent = pgTable('transfer_event', {
  id: text('id').primaryKey(),
  amount: bigint('amount', { mode: 'bigint' }).notNull(),
  timestamp: integer('timestamp').notNull(),
  from: text('from').notNull(),
  to: text('to').notNull(),
});

// Deposit Events
export const depositEvent = pgTable('deposit_event', {
  id: text('id').primaryKey(),
  chainId: integer('chain_id').notNull(),
  vaultAddress: text('vault_address').notNull(),
  sender: text('sender').notNull(),
  receiver: text('receiver').notNull(),
  assets: bigint('assets', { mode: 'bigint' }).notNull(),
  shares: bigint('shares', { mode: 'bigint' }).notNull(),
  timestamp: integer('timestamp').notNull(),
});

// Withdrawal Events
export const withdrawalEvent = pgTable('withdrawal_event', {
  id: text('id').primaryKey(),
  chainId: integer('chain_id').notNull(),
  vaultAddress: text('vault_address').notNull(),
  sender: text('sender').notNull(),
  receiver: text('receiver').notNull(),
  owner: text('owner').notNull(),
  assets: bigint('assets', { mode: 'bigint' }).notNull(),
  shares: bigint('shares', { mode: 'bigint' }).notNull(),
  timestamp: integer('timestamp').notNull(),
});

// Withdrawal Buckets
const withdrawBucketColumns = {
  chainId: integer('chain_id').notNull(),
  vaultAddress: text('vault_address').notNull(),
  bucketId: integer('bucket_id').notNull(),
  sum: bigint('sum', { mode: 'bigint' }).notNull(),
  count: integer('count').notNull(),
};

export const withdrawBuckets2Hours = pgTable('withdraw_buckets_2_hours', withdrawBucketColumns, (table) => ({
  pk: primaryKey({ columns: [table.chainId, table.vaultAddress, table.bucketId] }),
}));

export const withdrawBuckets8Hours = pgTable('withdraw_buckets_8_hours', withdrawBucketColumns, (table) => ({
  pk: primaryKey({ columns: [table.chainId, table.vaultAddress, table.bucketId] }),
}));

export const withdrawBuckets1Day = pgTable('withdraw_buckets_1_day', withdrawBucketColumns, (table) => ({
  pk: primaryKey({ columns: [table.chainId, table.vaultAddress, table.bucketId] }),
}));

export const withdrawBuckets4Days = pgTable('withdraw_buckets_4_days', withdrawBucketColumns, (table) => ({
  pk: primaryKey({ columns: [table.chainId, table.vaultAddress, table.bucketId] }),
}));

// Deposit Buckets
const depositBucketColumns = {
  chainId: integer('chain_id').notNull(),
  vaultAddress: text('vault_address').notNull(),
  bucketId: integer('bucket_id').notNull(),
  sum: bigint('sum', { mode: 'bigint' }).notNull(),
  count: integer('count').notNull(),
};

export const depositBuckets2Hours = pgTable('deposit_buckets_2_hours', depositBucketColumns, (table) => ({
  pk: primaryKey({ columns: [table.chainId, table.vaultAddress, table.bucketId] }),
}));

export const depositBuckets8Hours = pgTable('deposit_buckets_8_hours', depositBucketColumns, (table) => ({
  pk: primaryKey({ columns: [table.chainId, table.vaultAddress, table.bucketId] }),
}));

export const depositBuckets1Day = pgTable('deposit_buckets_1_day', depositBucketColumns, (table) => ({
  pk: primaryKey({ columns: [table.chainId, table.vaultAddress, table.bucketId] }),
}));

export const depositBuckets4Days = pgTable('deposit_buckets_4_days', depositBucketColumns, (table) => ({
  pk: primaryKey({ columns: [table.chainId, table.vaultAddress, table.bucketId] }),
}));

// Depositor
export const depositor = pgTable('depositor', {
  chainId: integer('chain_id').notNull(),
  vaultAddress: text('vault_address').notNull(),
  depositorAddress: text('depositor_address').notNull(),
  shareBalance: bigint('share_balance', { mode: 'bigint' }).notNull(),
  firstActivity: integer('first_activity').notNull(),
  lastActivity: integer('last_activity').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.chainId, table.vaultAddress, table.depositorAddress] }),
}));
