'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

export interface TrendPoint {
  week: string
  onTrack: number
  atRisk: number
}

// Static trend data — deterministic to avoid SSR hydration mismatch
const DEFAULT_TREND_DATA: TrendPoint[] = [
  { week: 'Wk 1', onTrack: 92, atRisk: 8 },
  { week: 'Wk 2', onTrack: 88, atRisk: 12 },
  { week: 'Wk 3', onTrack: 85, atRisk: 15 },
  { week: 'Wk 4', onTrack: 90, atRisk: 10 },
  { week: 'Wk 5', onTrack: 94, atRisk: 6 },
  { week: 'Wk 6', onTrack: 91, atRisk: 9 },
]

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className='rounded-xl border border-white/60 bg-white/95 p-3 shadow-float backdrop-blur-sm'>
      <p className='mb-2 text-xs font-medium text-brand-navy'>{label}</p>
      <div className='space-y-1'>
        {payload.map((entry, index) => (
          <div key={index} className='flex items-center gap-2 text-xs'>
            <div
              className='h-2 w-2 rounded-full'
              style={{ backgroundColor: entry.color }}
            />
            <span className='capitalize text-muted-foreground'>{entry.name}:</span>
            <span className='font-semibold text-brand-navy'>{entry.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface OperationalTrendChartProps {
  data?: TrendPoint[]
  title?: string
  description?: string
  primaryLabel?: string
  secondaryLabel?: string
  summaryLabel?: string
  className?: string
}

export function OperationalTrendChart({
  data = DEFAULT_TREND_DATA,
  title = 'Onboarding Track Rate',
  description = 'Share of active new hires on-track vs. at-risk, by week',
  primaryLabel = 'On-Track',
  secondaryLabel = 'At-Risk',
  summaryLabel = 'This Week',
  className,
}: OperationalTrendChartProps) {
  const latest = data[data.length - 1]

  return (
    <Card className={cn('flex h-full flex-col', className)}>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Icons.barChart className='h-4.5 w-4.5 text-brand-cornflower' strokeWidth={1.75} />
              {title}
            </CardTitle>
            <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
          </div>
          <div className='hidden text-right sm:block'>
            <p className='text-micro uppercase text-brand-muted'>{summaryLabel}</p>
            <p className='font-display text-lg font-bold text-emerald-600'>
              {latest.onTrack}% {primaryLabel.toLowerCase()}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className='flex-1 pt-4'>
        <ResponsiveContainer width='100%' height={260}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id='onTrackGradient' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='hsl(var(--chart-2))' stopOpacity={0.35} />
                <stop offset='95%' stopColor='hsl(var(--chart-2))' stopOpacity={0} />
              </linearGradient>
              <linearGradient id='atRiskGradient' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='#ef4444' stopOpacity={0.3} />
                <stop offset='95%' stopColor='#ef4444' stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray='3 3' stroke='hsl(var(--border))' vertical={false} />
            <XAxis
              dataKey='week'
              stroke='hsl(var(--muted-foreground))'
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke='hsl(var(--muted-foreground))'
              fontSize={12}
              tickLine={false}
              axisLine={false}
              unit='%'
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type='monotone'
              dataKey='onTrack'
              name={primaryLabel}
              stroke='hsl(var(--chart-2))'
              strokeWidth={2}
              fill='url(#onTrackGradient)'
            />
            <Area
              type='monotone'
              dataKey='atRisk'
              name={secondaryLabel}
              stroke='#ef4444'
              strokeWidth={2}
              fill='url(#atRiskGradient)'
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
