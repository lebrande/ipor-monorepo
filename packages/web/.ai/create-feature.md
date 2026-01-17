You are Blockchain, DeFi and frontend super developer whose task is to create a new feature as
described in `project-structure`.

Acceptance criteria:

- `feature_name` is `depositors-chart`
- As an user, when I go to `feature-path` in the web app (not api path),
- Then I see a pie chart (the feature):
  - where each pie reflects a share of depositor asset balance in whole vault tvl
  - each depositor from the first page has it's own pie
  - don't fetch other pages
  - display the remaining part as "others"
  - in the middle of the chart put the number of total active depositors
- The feature should appear on the top above depositors table

Tips:

- Follow the rules from `resources`.
- Read tech stack in `tech-stack`.
- Read recharts and shadcn docs in `recharts-pie-chart-docs`
- Read the example code `recharts-pie-chart-code-example` - this how the chart should look like
- If any shadcn component is not installed yet then follow the instructions in `shadcn-helper`.
- Fetch from `api-endpoint-depositors` to see what data is available for depositors list
- Fetch from `api-endpoint-metrics` to see what data is available for `totalShareBalance` and
  `activeDepositors`
- to calculate Total Value Locked use `convertToAssets` with on `totalShareBalance`

<feature-path>
/vaults/:chainId/:vaultAddress/depositors
</feature-path>

<project-structure>
.cursor/rules/project-structure.mdc
</project-structure>

<api-endpoint-depositors>
http://localhost:42069/api/vaults/8453/0x0d877Dc7C8Fa3aD980DfDb18B48eC9F8768359C4/depositors?page=1&limit=20
</api-endpoint-depositors>

<api-endpoint-metrics>
http://localhost:42069/api/vaults/8453/0x0d877Dc7C8Fa3aD980DfDb18B48eC9F8768359C4/metrics
</api-endpoint-metrics>

<tech-stack>
.cursor/rules/tech-stack.mdc
</tech-stack>

<resources>
.cursor/rules/shared.mdc
</resources>

<recharts-pie-chart-docs>
https://recharts.org/en-US/api/PieChart
https://ui.shadcn.com/charts/pie#charts
</recharts-pie-chart-docs>

<recharts-pie-chart-code-example>
import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from
"@/components/ui/card" import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, }
from "@/components/ui/chart"

export const description = "A donut chart with text"

const chartData = [ { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" }, { browser:
"safari", visitors: 200, fill: "var(--color-safari)" }, { browser: "firefox", visitors: 287, fill:
"var(--color-firefox)" }, { browser: "edge", visitors: 173, fill: "var(--color-edge)" }, { browser:
"other", visitors: 190, fill: "var(--color-other)" }, ]

const chartConfig = { visitors: { label: "Visitors", }, chrome: { label: "Chrome", color:
"var(--chart-1)", }, safari: { label: "Safari", color: "var(--chart-2)", }, firefox: { label:
"Firefox", color: "var(--chart-3)", }, edge: { label: "Edge", color: "var(--chart-4)", }, other: {
label: "Other", color: "var(--chart-5)", }, } satisfies ChartConfig

export function ChartPieDonutText() { const totalVisitors = React.useMemo(() => { return
chartData.reduce((acc, curr) => acc + curr.visitors, 0) }, [])

return ( <Card className="flex flex-col"> <CardHeader className="items-center pb-0"> <CardTitle>Pie
Chart - Donut with Text</CardTitle> <CardDescription>January - June 2024</CardDescription>
</CardHeader> <CardContent className="flex-1 pb-0"> <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        > <PieChart> <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
<Pie
              data={chartData}
              dataKey="visitors"
              nameKey="browser"
              innerRadius={60}
              strokeWidth={5}
            > <Label content={({ viewBox }) => { if (viewBox && "cx" in viewBox && "cy" in viewBox)
{ return ( <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      > <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        > {totalVisitors.toLocaleString()} </tspan> <tspan x={viewBox.cx}
y={(viewBox.cy || 0) + 24} className="fill-muted-foreground" > Visitors </tspan> </text> ) } }} />
</Pie> </PieChart> </ChartContainer> </CardContent> <CardFooter className="flex-col gap-2 text-sm">
<div className="flex items-center gap-2 leading-none font-medium"> Trending up by 5.2% this month
<TrendingUp className="h-4 w-4" /> </div> <div className="text-muted-foreground leading-none">
Showing total visitors for the last 6 months </div> </CardFooter> </Card> ) }
</recharts-pie-chart-code-example>

<shadcn-helper>
.cursor/rules/ui-shadcn-helper.mdc
</shadcn-helper>
