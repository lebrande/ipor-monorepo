'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { SharePriceHistoryPoint } from '@yo-protocol/core';

interface Props {
  history: SharePriceHistoryPoint[] | undefined;
  isLoading: boolean;
}

interface ChartPoint {
  timestamp: number;
  pricePerShare: number;
}

function formatDate(timestamp: number): string {
  const ms = timestamp < 1e12 ? timestamp * 1000 : timestamp;
  const d = new Date(ms);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatSharePrice(value: number): string {
  if (value >= 1000) return value.toFixed(2);
  if (value >= 1) return value.toFixed(4);
  return value.toFixed(6);
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: ChartPoint }>;
  label?: number;
}) {
  if (!active || !payload?.length || label === undefined) return null;
  return (
    <div className="bg-yo-dark border border-white/10 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-[10px] text-yo-muted mb-1">{formatDate(label)}</p>
      <p className="text-sm font-mono font-medium text-yo-neon">
        {formatSharePrice(payload[0].value)}
      </p>
      <p className="text-[10px] text-yo-muted">per share</p>
    </div>
  );
}

export function YoSharePriceChart({ history, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="bg-yo-dark rounded-lg border border-white/5 p-4 animate-pulse">
        <div className="h-3 w-32 bg-white/5 rounded mb-4" />
        <div className="h-[200px] bg-white/[0.02] rounded" />
      </div>
    );
  }

  if (!history || history.length === 0) return null;

  const chartData: ChartPoint[] = history.map((p) => ({
    timestamp: p.timestamp,
    pricePerShare: parseFloat(p.pricePerShare),
  }));

  return (
    <div className="bg-yo-dark rounded-lg border border-white/5 p-4">
      <h3 className="text-xs font-medium tracking-wider uppercase text-yo-muted mb-4">
        Share Price History
      </h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="sharePriceGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#D6FF34" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#D6FF34" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-muted"
              vertical={false}
            />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatDate}
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              tickFormatter={formatSharePrice}
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={60}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="pricePerShare"
              stroke="#D6FF34"
              strokeWidth={2}
              fill="url(#sharePriceGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#D6FF34', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
