"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@renderer/hooks/use-mobile"
import { useSettings } from "../context/SettingsContext"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@renderer/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@renderer/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@renderer/components/ui/toggle-group"

interface ChartBarInteractiveProps {
  data: any[]
  config: ChartConfig
  title: string
  description: string
  dataKeys?: string[]
  xAxisKey?: string
}

export function ChartBarInteractive({
  data,
  config,
  title,
  description,
  dataKeys = ["revenue"],
  xAxisKey = "date"
}: ChartBarInteractiveProps) {
  const { formatDate } = useSettings()
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const date = new Date(item[xAxisKey])
      if (isNaN(date.getTime())) return true;

      const referenceDate = new Date()
      let daysToSubtract = 90
      if (timeRange === "30d") {
        daysToSubtract = 30
      } else if (timeRange === "7d") {
        daysToSubtract = 7
      }
      const startDate = new Date(referenceDate)
      startDate.setDate(startDate.getDate() - daysToSubtract)
      return date >= startDate
    })
  }, [data, timeRange, xAxisKey])

  const barColors = [
    "var(--primary)",
    "var(--muted-foreground)",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ]

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {description}
          </span>
          <span className="@[540px]/card:hidden">{description}</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={config}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart data={filteredData} barGap={4} barCategoryGap="20%">
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                if (isNaN(date.getTime())) return value;
                return formatDate(date, {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${((value ?? 0) / 1000).toFixed(0)}k`}
              width={40}
              className="text-[10px]"
            />
            <ChartTooltip
              cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    const date = new Date(value)
                    if (isNaN(date.getTime())) return value;
                    return formatDate(date, {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            {dataKeys.map((key, i) => (
              <Bar
                key={key}
                dataKey={key}
                fill={barColors[i % barColors.length]}
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
