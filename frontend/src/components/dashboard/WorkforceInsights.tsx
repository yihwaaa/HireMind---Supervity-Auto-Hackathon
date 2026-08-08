'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface Breakdown {
  title: string
  icon: React.ElementType
  items: { label: string; value: number }[]
}

const BREAKDOWNS: Breakdown[] = [
  {
    title: 'By Location',
    icon: Icons.location,
    items: [
      { label: 'Remote', value: 88 },
      { label: 'New York', value: 46 },
      { label: 'Bengaluru', value: 39 },
      { label: 'London', value: 27 },
    ],
  },
  {
    title: 'By Department',
    icon: Icons.department,
    items: [
      { label: 'Engineering', value: 72 },
      { label: 'Sales', value: 54 },
      { label: 'Customer Success', value: 38 },
      { label: 'Finance', value: 36 },
    ],
  },
  {
    title: 'By Worker Type',
    icon: Icons.users,
    items: [
      { label: 'Full-Time', value: 164 },
      { label: 'Contractor', value: 28 },
      { label: 'Intern', value: 8 },
    ],
  },
  {
    title: 'New Hire Cohorts',
    icon: Icons.cohort,
    items: [
      { label: 'Jun 2026', value: 42 },
      { label: 'Jul 2026', value: 58 },
      { label: 'Aug 2026', value: 100 },
    ],
  },
]

export function WorkforceInsights({ className }: { className?: string }) {
  const maxValues = BREAKDOWNS.map((b) => Math.max(...b.items.map((i) => i.value)))

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader>
        <CardTitle className='text-base'>Workforce Insights</CardTitle>
      </CardHeader>
      <CardContent className='grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4'>
        {BREAKDOWNS.map((section, i) => (
          <div key={section.title}>
            <div className='mb-3 flex items-center gap-2'>
              <section.icon className='h-4 w-4 text-brand-cornflower' strokeWidth={1.75} />
              <p className='text-sm font-medium text-brand-navy'>{section.title}</p>
            </div>
            <div className='space-y-2.5'>
              {section.items.map((item) => (
                <div key={item.label}>
                  <div className='mb-1 flex items-center justify-between text-xs'>
                    <span className='text-brand-muted'>{item.label}</span>
                    <span className='font-medium tabular-nums text-brand-navy'>
                      {item.value}
                    </span>
                  </div>
                  <div className='h-1.5 w-full overflow-hidden rounded-full bg-muted'>
                    <div
                      className='h-full rounded-full bg-brand-navy/80'
                      style={{ width: `${(item.value / maxValues[i]) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
