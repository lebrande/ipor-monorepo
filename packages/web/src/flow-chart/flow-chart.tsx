import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FlowChartTooltip } from './components/flow-chart-tooltip';
import { useFlowChartContext, FlowChartContext } from './flow-chart.context';
import { CHART_COLORS, CHART_CONFIG } from './flow-chart.utils';
import { formatNumberWithSuffix } from '@/lib/format-number-with-suffix';
import { useFlowChartParams } from '@/flow-chart/flow-chart.params';
import { useFlowChartData } from '@/flow-chart/flow-chart.hooks';
import { FlowChartLoader } from './components/flow-chart-loader';
import { FlowChartNoData } from './components/flow-chart-no-data';
import { FlowChartTimeRangePicker } from './components/flow-chart-time-range-picker';

export const FlowChart = () => {
  const params = useFlowChartParams();

  return (
    <FlowChartContext.Provider
      value={{
        params,
      }}
    >
      <FlowChartContent />
    </FlowChartContext.Provider>
  );
};

export const FlowChartContent = () => {
  const {
    params: { isLoading, timeRange, setTimeRange },
  } = useFlowChartContext();

  const transformedData = useFlowChartData();

  if (isLoading) return <FlowChartLoader />;

  if (!transformedData || transformedData.length === 0) {
    return <FlowChartNoData />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h3>Flow Analysis</h3>
            <FlowChartTimeRangePicker
              value={timeRange}
              onValueChange={setTimeRange}
            />
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: CHART_COLORS.inflow }}
              />
              <span className="text-muted-foreground">Inflow</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: CHART_COLORS.outflow }}
              />
              <span className="text-muted-foreground">Outflow</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: CHART_COLORS.netFlow }}
              />
              <span className="text-muted-foreground">Net Flow</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={transformedData}
              margin={CHART_CONFIG.margin}
              stackOffset="sign"
            >
              <CartesianGrid
                strokeDasharray={CHART_CONFIG.strokeDasharray}
                className="stroke-muted"
              />
              <XAxis
                dataKey="date"
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
                minTickGap={50}
              />
              <YAxis
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatNumberWithSuffix(value)}
              />
              <Tooltip content={<FlowChartTooltip />} />
              <ReferenceLine y={0} stroke="#374151" strokeDasharray="2 2" />
              <Bar
                dataKey="inflow"
                fill={CHART_COLORS.inflow}
                name="Inflow"
                stackId="flow"
              />
              <Bar
                dataKey="outflow"
                fill={CHART_COLORS.outflow}
                name="Outflow"
                stackId="flow"
              />
              <Line
                type="monotone"
                dataKey="netFlow"
                stroke={CHART_COLORS.netFlow}
                strokeWidth={CHART_CONFIG.strokeWidth}
                dot={false}
                activeDot={{
                  r: CHART_CONFIG.activeDotRadius,
                  stroke: CHART_COLORS.netFlow,
                  strokeWidth: CHART_CONFIG.strokeWidth,
                }}
                name="Net Flow"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
