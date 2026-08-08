'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

export type RecommendationDomain =
  | 'payroll'
  | 'provisioning'
  | 'compliance'
  | 'engagement'
  | 'retention'
  | 'onboarding'
  | 'intake'
  | 'learning'
  | 'dependencies'

export interface Recommendation {
  title: string
  detail: string
  icon: React.ElementType
  urgency: 'now' | 'today' | 'this-week'
  domain?: RecommendationDomain
}

const DEFAULT_RECOMMENDATIONS: Recommendation[] = [
  {
    title: 'Escalate Payroll Exception',
    detail: 'Amara Chen — first paycheck exception unresolved 6 days.',
    icon: Icons.payroll,
    urgency: 'now',
    domain: 'payroll',
  },
  {
    title: 'Escalate Provisioning Blocker',
    detail: 'Diego Ferreira — VPN + repo access still pending on day 12.',
    icon: Icons.provisioning,
    urgency: 'now',
    domain: 'provisioning',
  },
  {
    title: 'Notify Hiring Manager',
    detail: 'Tom Whitfield — compliance training overdue 9 days.',
    icon: Icons.mail,
    urgency: 'today',
    domain: 'compliance',
  },
  {
    title: 'Trigger Engagement Follow-Up',
    detail: 'Priya Nair — engagement pulse down 34 points in 2 weeks.',
    icon: Icons.engagement,
    urgency: 'today',
    domain: 'engagement',
  },
  {
    title: 'Launch Retention Intervention',
    detail: 'Layla Haddad — no manager 1:1 logged since start date.',
    icon: Icons.retention,
    urgency: 'this-week',
    domain: 'retention',
  },
]

const urgencyLabel: Record<Recommendation['urgency'], string> = {
  now: 'Act now',
  today: 'Today',
  'this-week': 'This week',
}

const urgencyStyles: Record<Recommendation['urgency'], string> = {
  now: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
  today: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  'this-week': 'bg-muted text-brand-muted ring-1 ring-inset ring-border',
}

interface AIRecommendationsProps {
  items?: Recommendation[]
  domainFilter?: RecommendationDomain
  title?: string
  className?: string
  emptyMessage?: string
}

export function AIRecommendations({
  items = DEFAULT_RECOMMENDATIONS,
  domainFilter,
  title = 'AI Recommendations',
  className,
  emptyMessage = 'No open recommendations for this view — connect live data to populate this rail.',
}: AIRecommendationsProps) {
  const filtered = domainFilter
    ? items.filter((rec) => rec.domain === domainFilter)
    : items

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <Icons.sparkles className='h-4.5 w-4.5 text-brand-cornflower' strokeWidth={1.75} />
          {title}
        </CardTitle>
        <span className='text-micro uppercase text-brand-muted'>Ranked by impact</span>
      </CardHeader>
      <CardContent className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        {filtered.length === 0 ? (
          <p className='col-span-full py-6 text-center text-sm text-brand-muted'>
            {emptyMessage}
          </p>
        ) : (
          filtered.map((rec) => (
            <div
              key={rec.title}
              className='flex items-start gap-3 rounded-xl border border-border/60 bg-white/60 p-3.5 transition-colors hover:border-brand-cornflower/40'
            >
              <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-navy/5 text-brand-navy'>
                <rec.icon className='h-4.5 w-4.5' strokeWidth={1.75} />
              </div>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center justify-between gap-2'>
                  <p className='truncate text-sm font-medium text-brand-navy'>
                    {rec.title}
                  </p>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      urgencyStyles[rec.urgency]
                    )}
                  >
                    {urgencyLabel[rec.urgency]}
                  </span>
                </div>
                <p className='mt-0.5 text-xs text-brand-muted'>{rec.detail}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
