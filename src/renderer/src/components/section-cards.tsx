import { motion } from "framer-motion"
import { TrendingUp, TrendingDown } from "lucide-react"

import { Badge } from "@renderer/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@renderer/components/ui/card"

export interface SectionCardData {
  title: string
  value: string | number
  trend: string
  trendType: "up" | "down"
  footerTitle: string
  footerSub: string
}

interface SectionCardsProps {
  cards: SectionCardData[]
}

export function SectionCards({ cards }: SectionCardsProps) {
  return (
    <div data-tutorial-section="kpi-cards" className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/[0.02] *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.05, ease: [0.28, 0, 0.22, 1] }}
        >
          <Card className="@container/card relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/[0.03] to-transparent rounded-bl-full" />
            <CardHeader>
              <CardDescription className="text-[11px] font-medium uppercase tracking-wider">{card.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums tracking-tight @[250px]/card:text-3xl">
                {card.value}
              </CardTitle>
              <CardAction>
                <Badge variant={card.trendType === "up" ? "success" : "warning"} className="gap-1 text-xs">
                  {card.trendType === "up" ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {card.trend}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-xs">
              <div className="line-clamp-1 flex gap-2 font-medium text-foreground/70">
                {card.footerTitle}
              </div>
              <div className="text-muted-foreground/60 text-[11px]">
                {card.footerSub}
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
