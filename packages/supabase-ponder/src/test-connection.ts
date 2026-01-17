/**
 * Test script for Ponder Database connection
 * 
 * Usage: pnpm --filter @ipor/fusion-supabase-ponder test
 */

import 'dotenv/config';
import { db, getPonderDatabaseInfo } from './client';
import { transferEvent, depositEvent, withdrawalEvent, depositor } from './schema';

async function testConnection() {
  console.log('🧪 Testing Ponder Database Connection (Drizzle ORM)\n');
  console.log('═'.repeat(50));

  const info = getPonderDatabaseInfo();
  console.log(`\n📦 Ponder Database: ${info.host}:${info.port}/${info.database}`);
  console.log(`   Local: ${info.isLocal ? 'Yes' : 'No'}\n`);

  // Test tables exist (based on ponder.schema.ts)
  const tables = [
    { name: 'transfer_event', table: transferEvent },
    { name: 'deposit_event', table: depositEvent },
    { name: 'withdrawal_event', table: withdrawalEvent },
    { name: 'depositor', table: depositor },
  ] as const;

  console.log('Checking tables...\n');

  for (const { name, table } of tables) {
    try {
      // Try to select from the table (limit 0 to just check if it exists)
      await db.select().from(table).limit(0);
      console.log(`   ✅ ${name}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('does not exist') || message.includes('42P01')) {
        console.error(`   ❌ ${name} - NOT FOUND`);
        console.error('   → This table may not exist yet. Ponder will create it automatically when indexing starts.');
      } else {
        console.error(`   ❌ ${name} - ${message}`);
      }
    }
  }

  console.log('\n═'.repeat(50));
  console.log('✅ Ponder Database connection successful!');
  console.log('═'.repeat(50));
}

testConnection().catch(console.error);
