'use client'

import { LineChart, Line, XAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { MoneyTooltip } from '@/components/ui/MoneyTooltip'

type Props = {
  data: { label: string; value: number }[]
}

const chartConfig = {
  value: { label: 'Balance', color: 'var(--bl-accent)' },
}

export function BudgetLineChart({ data }: Props) {
  if (data.length === 0) return <p className="text-sm text-ink-muted">No activity</p>

  return (
    <div className="h-40 w-full">
      <ChartContainer config={chartConfig} className="bl-chart aspect-auto h-full w-full">
        <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={10} minTickGap={24} />
          <ChartTooltip
            cursor={{ stroke: 'var(--bl-border-strong)' }}
            content={<MoneyTooltip labels={{ value: 'Balance' }} />}
          />
          <Line
            type="linear"
            dataKey="value"
            stroke="var(--color-value)"
            strokeWidth={2.25}
            strokeLinecap="round"
            dot={false}
            activeDot={{ r: 4, fill: 'var(--color-value)', stroke: 'var(--bl-surface)', strokeWidth: 2 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}
