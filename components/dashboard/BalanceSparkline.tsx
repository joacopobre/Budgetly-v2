'use client'
import { XAxis, CartesianGrid, AreaChart, Area } from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { MoneyTooltip } from '@/components/ui/MoneyTooltip'

import type { BalancePoint } from '@/lib/transactions/buildBalanceSeries'
type Props = {
  data: BalancePoint[]
}

const chartConfig = {
  balance: { label: 'Balance', color: 'var(--bl-accent)' },
}

export function BalanceSparkline({ data }: Props) {
  if (data.length === 0) return null
  return (
    <div className="h-24 w-full">
      <ChartContainer config={chartConfig} className="bl-chart aspect-auto h-full w-full">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-balance)" stopOpacity={0.16} />
              <stop offset="100%" stopColor="var(--color-balance)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" hide />
          <ChartTooltip content={<MoneyTooltip labels={{ balance: 'Balance' }} />} />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="var(--color-balance)"
            fill="url(#balanceFill)"
            strokeWidth={2.25}
            dot={false}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}
