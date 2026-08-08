'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface HealthMetric {
  label: string
  value: number // 0-100
  detail: string
}

const DEFAULT_HEALTH_METRICS: HealthMetric[] = [
  { label: 'Task Completion', value: 82, detail: '164 / 200 onboarding tasks closed' },
  { label: 'Provisioning Status', value: 71, detail: '142 / 200 access requests fulfilled' },
  { label: 'Learning Completion', value: 64, detail: '128 / 200 required modules done' },
  { label: 'Compliance Completion', value: 88, detail: '176 / 200 documents verified' },
]

function barColor(value: number) {
  if (value >= 80) return 'bg-emerald-500'
  if (value >= 60) return 'bg-brand-cornflower'
  return 'bg-amber-500'
}

interface OnboardingHealthProps {
  metrics?: HealthMetric[]
  title?: string
  subtitle?: string
  className?: string
}

export function OnboardingHealth({
  metrics = DEFAULT_HEALTH_METRICS,
  title = 'Onboarding Health',
  subtitle = 'Cohort: Last 30 days',
  className,
}: OnboardingHealthProps) {
  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0'>
        <CardTitle className='text-base'>{title}</CardTitle>
        <span className='text-micro uppercase text-brand-muted'>{subtitle}</span>
      </CardHeader>
      <CardContent className='space-y-5'>
        {metrics.map((metric) => (
          <div key={metric.label}>
            <div className='mb-1.5 flex items-baseline justify-between'>
              <span className='text-sm font-medium text-brand-navy'>
                {metric.label}
              </span>
              <span className='text-sm font-semibold tabular-nums text-brand-navy'>
                {metric.value}%
              </span>
            </div>
            <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
              <div
                className={cn('h-full rounded-full', barColor(metric.value))}
                style={{ width: `${metric.value}%` }}
              />
            </div>
            <p className='mt-1 text-xs text-brand-muted'>{metric.detail}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
