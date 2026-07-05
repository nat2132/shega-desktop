"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@renderer/hooks/use-mobile"
import { useSettings } from "../context/SettingsContext"
import { toEthiopianDate, getEthiopianMonthName } from "../utils/ethiopian-calendar"
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

export const description = "An interactive area chart"

interface ChartAreaInteractiveProps {
  data: any[]
  config: ChartConfig
  title: string
  description: string
  dataKey?: string
  xAxisKey?: string
}

function getGregorianMonthName(m: number, lang: string) {
  const names: Record<string, string[]> = {
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    am: ['ጃን', 'ፌብ', 'ማር', 'ኤፕ', 'ሜይ', 'ጁን', 'ጁል', 'ኦገ', 'ሴፕ', 'ኦክቶ', 'ኖቬ', 'ዲሴ'],
    om: ['Amajj', 'Gurra', 'Bito', 'Eebil', 'Caams', 'Waxa', 'Adoo', 'Hagay', 'Fulb', 'Onko', 'Sada', 'Mudd'],
    ti: ['ጥሪ', 'ለካ', 'መጋ', 'ሚያ', 'ግን', 'ሰነ', 'ሓም', 'ነሓ', 'መስ', 'ጥቅ', 'ሕዳ', 'ታሕ']
  }
  return (names[lang] || names.en)[m] || names.en[m]
}

function getGregorianDayName(d: number, lang: string) {
  const names: Record<string, string[]> = {
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    am: ['እሁድ', 'ሰኞ', 'ማክሰ', 'ረቡዕ', 'ሐሙስ', 'አርብ', 'ቅዳሜ'],
    om: ['Dil', 'Wix', 'Saa', 'Roo', 'Kam', 'Jim', 'San'],
    ti: ['ሰን', 'ሰኑ', 'ሰሉ', 'ረቡ', 'ሓሙ', 'ዓር', 'ቀዳ']
  }
  return (names[lang] || names.en)[d] || names.en[d]
}

export function ChartAreaInteractive({ 
  data, 
  config, 
  title, 
  description,
  dataKey = "revenue",
  xAxisKey = "date"
}: ChartAreaInteractiveProps) {
  const { formatDate, calendarType, language } = useSettings()
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile && !timeRange.startsWith("this-")) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const isEthiopian = calendarType === 'ethiopian'

  const displayData = React.useMemo(() => {
    const raw = data.filter((item) => {
      const date = new Date(item[xAxisKey])
      if (isNaN(date.getTime())) return true
      const ref = new Date()
      let start: Date
      if (timeRange === "this-week") {
        start = new Date(ref)
        start.setDate(start.getDate() - start.getDay())
        start.setHours(0, 0, 0, 0)
      } else if (timeRange === "this-month") {
        start = new Date(ref.getFullYear(), ref.getMonth(), 1)
      } else if (timeRange === "this-year") {
        start = new Date(ref.getFullYear(), 0, 1)
      } else {
        start = new Date(ref)
        let d = 90
        if (timeRange === "30d") d = 30
        else if (timeRange === "7d") d = 7
        start.setDate(start.getDate() - d)
      }
      return date >= start
    })

    if (timeRange === "this-week") {
      const now = new Date()
      const todayDow = now.getDay()
      const groups: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
      raw.forEach(item => {
        const d = new Date(item[xAxisKey])
        if (isNaN(d.getTime())) return
        const dow = d.getDay()
        groups[dow] = (groups[dow] || 0) + (item[dataKey] || 0)
      })
      return [0, 1, 2, 3, 4, 5, 6].map(dow => ({
        label: getGregorianDayName(dow, language),
        [dataKey]: groups[dow] || 0,
        isCurrent: dow === todayDow
      }))
    }

    if (timeRange === "this-month") {
      const now = new Date()
      const ref = isEthiopian ? toEthiopianDate(now) : null
      const currentDay = isEthiopian ? ref!.day : now.getDate()
      const currentWeekNum = Math.ceil(currentDay / 7)
      const groups: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      raw.forEach(item => {
        const d = new Date(item[xAxisKey])
        if (isNaN(d.getTime())) return
        const day = isEthiopian ? toEthiopianDate(d).day : d.getDate()
        const wn = Math.min(Math.ceil(day / 7), 5)
        groups[wn] = (groups[wn] || 0) + (item[dataKey] || 0)
      })
      const wkLabel = language === 'am' ? 'ሳም' : language === 'om' ? 'Tor' : language === 'ti' ? 'ሳም' : 'Wk'
      return [1, 2, 3, 4, 5].map(wn => ({
        label: `${wkLabel} ${wn}`,
        [dataKey]: groups[wn] || 0,
        isCurrent: wn === currentWeekNum
      }))
    }

    if (timeRange === "this-year") {
      const now = new Date()
      let currentMonth: number
      let monthCount: number
      if (isEthiopian) {
        const et = toEthiopianDate(now)
        currentMonth = et.month - 1
        monthCount = 13
      } else {
        currentMonth = now.getMonth()
        monthCount = 12
      }
      const groups: Record<number, number> = {}
      for (let i = 0; i < monthCount; i++) groups[i] = 0
      raw.forEach(item => {
        const d = new Date(item[xAxisKey])
        if (isNaN(d.getTime())) return
        let mi: number
        if (isEthiopian) {
          mi = toEthiopianDate(d).month - 1
        } else {
          mi = d.getMonth()
        }
        groups[mi] = (groups[mi] || 0) + (item[dataKey] || 0)
      })
      const result: any[] = []
      for (let i = 0; i < monthCount; i++) {
        let label: string
        if (isEthiopian) {
          label = getEthiopianMonthName(i, language as any).slice(0, 4)
        } else {
          label = getGregorianMonthName(i, language)
        }
        result.push({
          label,
          [dataKey]: groups[i] || 0,
          isCurrent: i === currentMonth
        })
      }
      return result
    }

    return raw.map((item, _i) => {
      const d = new Date(item[xAxisKey])
      const now = new Date()
      const isToday = !isNaN(d.getTime()) && 
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      return { ...item, isCurrent: isToday }
    })
  }, [data, timeRange, xAxisKey, dataKey, isEthiopian, language])

  const isGrouped = timeRange.startsWith("this-")
  const xKey = isGrouped ? 'label' : xAxisKey
  const showHighlight = isGrouped

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
            className="hidden *:data-[slot=toggle-group-item]:px-3! @[767px]/card:flex"
          >
            <ToggleGroupItem value="this-week">This Week</ToggleGroupItem>
            <ToggleGroupItem value="this-month">This Month</ToggleGroupItem>
            <ToggleGroupItem value="this-year">This Year</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-44 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="this-week" className="rounded-lg font-bold text-primary">
                This Week
              </SelectItem>
              <SelectItem value="this-month" className="rounded-lg font-bold text-primary">
                This Month
              </SelectItem>
              <SelectItem value="this-year" className="rounded-lg font-bold text-primary">
                This Year
              </SelectItem>
              <div className="border-t my-1 mx-2" />
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
          <AreaChart data={displayData} margin={{ left: 10, right: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="fillPrimary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="fillCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2, #f59e0b)" stopOpacity={0.5} />
                <stop offset="95%" stopColor="var(--chart-2, #f59e0b)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              minTickGap={0}
              tick={{ fontSize: 11, fontWeight: 600, fill: 'var(--muted-foreground)' }}
              tickFormatter={(value) => {
                if (xKey === 'label') return value
                const d = new Date(value)
                if (isNaN(d.getTime())) return value
                return formatDate(d, { month: 'short', day: 'numeric' })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    if (xKey === 'label') return value
                    const d = new Date(value)
                    if (isNaN(d.getTime())) return value
                    return formatDate(d, { month: 'short', day: 'numeric' })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey={dataKey}
              type="natural"
              fill="url(#fillPrimary)"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={showHighlight ? (props: any) => {
                const { cx, cy, payload } = props
                if (payload.isCurrent) {
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={8} fill="var(--chart-2, #f59e0b)" stroke="white" strokeWidth={3} opacity={0.25} />
                      <circle cx={cx} cy={cy} r={5} fill="var(--chart-2, #f59e0b)" stroke="white" strokeWidth={2} />
                    </g>
                  )
                }
                return <circle cx={cx} cy={cy} r={3} fill="var(--primary)" opacity={0.5} />
              } : false}
              activeDot={{ r: 5, stroke: 'white', strokeWidth: 2, fill: 'var(--primary)' }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
