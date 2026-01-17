import { Hono } from 'hono';
import { validateSmartContractParams } from '../../utils/validate-smart-contract-params';
import { validatePagination } from '../../utils/validate-pagination';
import { db } from 'ponder:api';
import { and, eq, gt, desc, sql } from 'ponder';
import schema from 'ponder:schema';

export const depositors = new Hono();

depositors.get('/:chainId/:vaultAddress/depositors', async (c) => {
  const params = validateSmartContractParams({
    chainId: c.req.param('chainId'),
    address: c.req.param('vaultAddress'),
  });

  if (params.type === 'error') {
    return c.json({ error: params.message }, 400);
  }

  const pagination = validatePagination({
    page: c.req.query('page'),
    limit: c.req.query('limit'),
  });

  if (pagination.type === 'error') {
    return c.json({ error: pagination.message }, 400);
  }

  const { chainId, address } = params;
  const { page, limit, offset } = pagination;

  // Get total count of depositors with positive balance
  const totalCountResult = await db
    .select({
      count: sql`count(*)`,
    })
    .from(schema.depositor)
    .where(
      and(
        eq(schema.depositor.chainId, chainId),
        eq(schema.depositor.vaultAddress, address),
        gt(schema.depositor.shareBalance, 0n),
      ),
    );

  const totalCount = Number(totalCountResult[0]?.count || 0);
  const totalPages = Math.ceil(totalCount / limit);

  // Get paginated depositors
  const depositors = await db
    .select({
      depositorAddress: schema.depositor.depositorAddress,
      shareBalance: schema.depositor.shareBalance,
      firstActivity: schema.depositor.firstActivity,
      lastActivity: schema.depositor.lastActivity,
    })
    .from(schema.depositor)
    .where(
      and(
        eq(schema.depositor.chainId, chainId),
        eq(schema.depositor.vaultAddress, address),
        gt(schema.depositor.shareBalance, 0n), // Only show depositors with positive balance
      ),
    )
    .orderBy(desc(schema.depositor.shareBalance))
    .limit(limit)
    .offset(offset);

  return c.json({
    depositors: depositors.map((depositor) => ({
      address: depositor.depositorAddress,
      shareBalance: depositor.shareBalance.toString(),
      firstActivity: depositor.firstActivity,
      lastActivity: depositor.lastActivity,
    })),
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
      limit,
    },
  });
});
