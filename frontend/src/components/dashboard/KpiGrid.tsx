'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

export interface Kpi {
  title: string
  value: string
  icon: React.ElementType
  trend?: { value: string; positive: boolean }
  tone: 'navy' | 'red' | 'amber' | 'cornflower' | 'emerald'
}

const TONE_STYLES: Record<Kpi['tone'], string> = {
  navy: 'bg-brand-navy',
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  cornflower: 'bg-brand-cornflower',
  emerald: 'bg-emerald-500',
}

// Default dataset — used by the Executive Overview page.
const DEFAULT_KPIS: Kpi[] = [
  {
    title: 'Active New Hires',
    value: '200',
    icon: Icons.userPlus,
    trend: { value: '+18 this month', positive: true },
    tone: 'navy',
  },
  {
    title: 'High Risk Employees',
    value: '5',
    icon: Icons.risk,
    trend: { value: '+2 vs last week', positive: false },
    tone: 'red',
  },
  {
    title: 'Payroll Issues',
    value: '7',
    icon: Icons.payroll,
    trend: { value: '-3 vs last week', positive: true },
    tone: 'amber',
  },
  {
    title: 'Blocked Provisioning',
    value: '12',
    icon: Icons.provisioning,
    trend: { value: '+4 vs last week', positive: false },
    tone: 'amber',
  },
  {
    title: 'Compliance Overdue',
    value: '9',
    icon: Icons.compliance,
    trend: { value: '-5 vs last week', positive: true },
    tone: 'cornflower',
  },
  {
    title: 'Avg Engagement Score',
    value: '76',
    icon: Icons.engagement,
    trend: { value: '+3 pts', positive: true },
    tone: 'emerald',
  },
]

export function KpiGrid({
  kpis = DEFAULT_KPIS,
  className,
}: {
  kpis?: Kpi[]
  className?: string
}) {
  return (
    <div className={cn('grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6', className)}>
      {kpis.map((kpi) => (
        <Card key={kpi.title} className='h-full'>
          <CardContent className='p-4'>
            <div className='flex items-start justify-between'>
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg text-white',
                  TONE_STYLES[kpi.tone]
                )}
              >
                <kpi.icon className='h-4 w-4' strokeWidth={1.75} />
              </div>
              {kpi.trend && (
                <span
                  className={cn(
                    'flex items-center gap-0.5 text-[11px] font-medium',
                    kpi.trend.positive ? 'text-emerald-600' : 'text-red-500'
                  )}
                >
                  <Icons.trendingUp
                    className={cn('h-3 w-3', !kpi.trend.positive && 'rotate-180')}
                    strokeWidth={2}
                  />
                  {kpi.trend.value}
                </span>
              )}
            </div>
            <p className='mt-3 font-display text-2xl font-bold leading-none tracking-tight text-brand-navy'>
              {kpi.value}
            </p>
            <p className='mt-1.5 text-xs font-medium uppercase tracking-wide text-brand-muted'>
              {kpi.title}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
