"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type LineTrendChartPoint = Record<string, string | number>;

type LineTrendChartProps = {
  data: LineTrendChartPoint[];
  dataKey: string;
  xKey?: string;
  className?: string;
  heightClassName?: string;
  strokeColor?: string;
  dotColor?: string;
  yDomain?: [number, number];
  yTicks?: number[];
  yAxisLabel?: string;
  valueSuffix?: string;
  seriesLabel?: string;
};

export function LineTrendChart({
  data,
  dataKey,
  xKey = "month",
  className,
  heightClassName = "h-[210px]",
  strokeColor = "#F3A423",
  dotColor = "#F3A423",
  yDomain = [0, 40000],
  yTicks = [0, 10000, 20000, 30000, 40000],
  yAxisLabel = "ETB",
  valueSuffix = " ETB",
  seriesLabel = "Commission",
}: LineTrendChartProps) {
  const chartConfig = {
    [dataKey]: {
      label: seriesLabel,
      color: strokeColor,
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      config={chartConfig}
      className={cn("aspect-auto w-full", heightClassName, className)}
    >
      <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
        <CartesianGrid
          vertical={false}
          strokeDasharray="4 4"
          stroke="#E5E7EB"
        />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tick={{ fill: "#64748B", fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickMargin={8}
          domain={yDomain}
          ticks={yTicks}
          tick={{ fill: "#64748B", fontSize: 11 }}
          tickFormatter={(value: number) => value.toLocaleString()}
          label={{
            value: yAxisLabel,
            angle: -90,
            position: "insideLeft",
            offset: 0,
            style: { fill: "#64748B", fontSize: 11 },
          }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => [
                `${Number(value).toLocaleString()}${valueSuffix}`,
                seriesLabel,
              ]}
              indicator="line"
            />
          }
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={`var(--color-${dataKey})`}
          strokeWidth={3}
          dot={{ r: 4, fill: dotColor, strokeWidth: 2, stroke: "#FFFFFF" }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ChartContainer>
  );
}

export default LineTrendChart;
