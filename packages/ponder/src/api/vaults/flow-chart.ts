import { Hono } from 'hono';
import { validateSmartContractParams } from '../../utils/validate-smart-contract-params';
import { db } from 'ponder:api';
import { and, eq, gte, gt, sql } from 'ponder';
import {
  BUCKET_SIZE,
  getBucketId,
  getDepositBucketSchema,
  getWithdrawBucketSchema,
} from '../../utils/buckets';
import { getUnixTime } from 'date-fns';
import { validatePeriod } from '../../utils/validate-period';
import { periodConfig } from '../../utils/periods';
import { reverse } from 'remeda';

export const flowChart = new Hono();

flowChart.get('/:chainId/:vaultAddress/flow-chart', async (c) => {
  const params = validateSmartContractParams({
    chainId: c.req.param('chainId'),
    address: c.req.param('vaultAddress'),
  });

  if (params.type === 'error') {
    return c.json({ error: params.message }, 400);
  }

  const query = validatePeriod({
    period: c.req.query('timeRange') || '7d',
  });

  if (query.type === 'error') {
    return c.json({ error: query.message }, 400);
  }

  const { period } = query;

  const { bucketCount, bucketSize } = periodConfig[period];

  const now = getUnixTime(new Date());

  const endBucketId = getBucketId(now, bucketSize);

  const buckets = reverse(
    Array.from({ length: bucketCount }, (_, i) => {
      return endBucketId - i * BUCKET_SIZE[bucketSize];
    }),
  );

  const startBucketId = buckets.at(0);

  if (startBucketId === undefined) {
    throw new Error('No buckets found');
  }

  const withdrawBucketSchema = getWithdrawBucketSchema(bucketSize);

  const withdrawBuckets = await db
    .select({
      bucketId: withdrawBucketSchema.bucketId,
      sum: withdrawBucketSchema.sum,
      count: withdrawBucketSchema.count,
    })
    .from(withdrawBucketSchema)
    .where(
      and(
        eq(withdrawBucketSchema.chainId, params.chainId),
        eq(withdrawBucketSchema.vaultAddress, params.address),
        gte(withdrawBucketSchema.bucketId, startBucketId),
      ),
    )
    .limit(100);

  const depositBucketSchema = getDepositBucketSchema(bucketSize);

  const depositBuckets = await db
    .select({
      bucketId: depositBucketSchema.bucketId,
      sum: depositBucketSchema.sum,
      count: depositBucketSchema.count,
    })
    .from(depositBucketSchema)
    .where(
      and(
        eq(depositBucketSchema.chainId, params.chainId),
        eq(depositBucketSchema.vaultAddress, params.address),
        gte(depositBucketSchema.bucketId, startBucketId),
      ),
    )
    .limit(1000);

  const chartData = buckets.map((bucketId) => {
    const withdraw = withdrawBuckets.find((b) => b.bucketId === bucketId) || {
      sum: 0n,
      count: 0,
    };
    const deposit = depositBuckets.find((b) => b.bucketId === bucketId) || {
      sum: 0n,
      count: 0,
    };

    return {
      bucketId,
      withdraw: {
        sum: withdraw.sum,
        count: withdraw.count,
      },
      deposit: {
        sum: deposit.sum,
        count: deposit.count,
      },
    };
  });

  return c.json({
    flowChart: {
      chartData,
    },
  });
});
