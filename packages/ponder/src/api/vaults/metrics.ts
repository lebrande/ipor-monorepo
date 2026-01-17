import { Hono } from 'hono';
import { validateSmartContractParams } from '../../utils/validate-smart-contract-params';
import { db } from 'ponder:api';
import { and, eq, gt, sql } from 'ponder';
import schema from 'ponder:schema';

export const metrics = new Hono();

metrics.get('/:chainId/:vaultAddress/metrics', async (c) => {
  const params = validateSmartContractParams({
    chainId: c.req.param('chainId'),
    address: c.req.param('vaultAddress'),
  });

  if (params.type === 'error') {
    return c.json({ error: params.message }, 400);
  }

  const activeDepositors = await db
    .select({
      totalBalance: sql`sum(${schema.depositor.shareBalance})`,
      count: sql`count(distinct ${schema.depositor.depositorAddress})`,
    })
    .from(schema.depositor)
    .where(
      and(
        eq(schema.depositor.chainId, params.chainId),
        eq(schema.depositor.vaultAddress, params.address),
        gt(schema.depositor.shareBalance, 0n), // Only show depositors with positive balance
      ),
    );

  const allTimeDepositors = await db
    .select({
      count: sql`count(distinct ${schema.depositor.depositorAddress})`,
    })
    .from(schema.depositor)
    .where(
      and(
        eq(schema.depositor.chainId, params.chainId),
        eq(schema.depositor.vaultAddress, params.address),
      ),
    );

  const firstDeposit = await db
    .select({
      firstDepositTimestamp: sql`min(${schema.depositEvent.timestamp})`,
    })
    .from(schema.depositEvent)
    .where(
      and(
        eq(schema.depositEvent.chainId, params.chainId),
        eq(schema.depositEvent.vaultAddress, params.address),
      ),
    );

  return c.json({
    metrics: {
      totalShareBalance: activeDepositors[0]?.totalBalance,
      activeDepositors: activeDepositors[0]?.count,
      allTimeDepositors: allTimeDepositors[0]?.count,
      firstDeposit: firstDeposit[0]?.firstDepositTimestamp,
    },
  });
});
