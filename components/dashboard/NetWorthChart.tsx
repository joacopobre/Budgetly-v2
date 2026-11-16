'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { MoneyTooltip, shortAxisLabel } from '@/components/ui/MoneyTooltip'
import { formatCurrency } from '@/lib/currency'
import type { NetWorthPoint } from '@/lib/transactions/buildNetWorthSeries'

type Props = {
  data: NetWorthPoint[]
}

const chartConfig = {
  balance: { label: 'Net worth', color: 'var(--bl-accent)' },
}

const labels = { balance: 'Net worth' }

export function NetWorthChart({ data }: Props) {
  if (data.length === 0)
    return <p className="py-10 text-center text-sm text-ink-muted">No data for this period</p>

  return (
    <div className="h-44 w-full overflow-hidden sm:h-48">
      <ChartContainer className="bl-chart aspect-auto h-full w-full" config={chartConfig}>
        <AreaChart data={data} margin={{ top: 6, right: 20, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-balance)" stopOpacity={0.16} />
              <stop offset="100%" stopColor="var(--color-balance)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            minTickGap={24}
            tickFormatter={shortAxisLabel}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => formatCurrency(value, { compact: true })}
            width={50}
          />
          <ChartTooltip
            cursor={{ stroke: 'var(--bl-border-strong)' }}
            content={<MoneyTooltip labels={labels} />}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="var(--color-balance)"
            fill="url(#netWorthFill)"
            strokeWidth={2.5}
            strokeLinecap="round"
            dot={false}
            activeDot={{ r: 4, fill: 'var(--color-balance)', stroke: 'var(--bl-surface)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}
