'use client'
import { TrendPoint } from '@/lib/transactions/buildTrendSeries'
import { BarChart, Bar, XAxis, CartesianGrid, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { MoneyTooltip, shortAxisLabel } from '@/components/ui/MoneyTooltip'

type Props = {
  data: TrendPoint[]
}

const chartConfig = {
  income: { label: 'Income', color: 'var(--bl-accent)' },
  expenses: { label: 'Spending', color: 'var(--bl-fg-faint)' },
}

const labels = { income: 'Income', expenses: 'Spending' }

export function TrendChart({ data }: Props) {
  if (data.length === 0)
    return <p className="py-10 text-center text-sm text-ink-muted">No data for this period</p>

  return (
    <div className="h-52 w-full overflow-hidden sm:h-60">
      <ChartContainer className="bl-chart aspect-auto h-full w-full" config={chartConfig}>
        <BarChart data={data} barGap={4} barCategoryGap="28%" margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            minTickGap={8}
            tickFormatter={shortAxisLabel}
          />
          <YAxis hide />
          <ChartTooltip
            cursor={{ fill: 'var(--bl-bg-sunk)', opacity: 0.7 }}
            content={<MoneyTooltip labels={labels} />}
          />
          <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} maxBarSize={30} />
          <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} maxBarSize={30} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
