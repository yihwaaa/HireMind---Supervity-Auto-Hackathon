'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

const SUGGESTED_QUERIES = [
  'Which employees are highest risk today?',
  'Summarize open provisioning blockers',
  'Draft a nudge for overdue compliance training',
  'Why did engagement drop in Sales this week?',
]

export function AIAssistantPanel({ className }: { className?: string }) {
  return (
    <Card className={cn('flex h-full flex-col', className)}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <Icons.workbench className='h-4.5 w-4.5 text-brand-cornflower' strokeWidth={1.75} />
          AI Assistant
        </CardTitle>
        <span className='inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600'>
          <span className='h-1.5 w-1.5 rounded-full bg-emerald-500' />
          Online
        </span>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col gap-4'>
        <p className='text-sm text-brand-muted'>
          Ask HireMind about any employee, risk driver, or open intervention.
          It reads live onboarding, payroll, and compliance signals.
        </p>

        <div className='space-y-2'>
          {SUGGESTED_QUERIES.map((q) => (
            <Link
              key={q}
              href={`/workbench?q=${encodeURIComponent(q)}`}
              className='block rounded-lg border border-border/60 bg-white/60 px-3 py-2 text-sm text-brand-navy transition-colors hover:border-brand-cornflower/40 hover:bg-brand-cornflower/5'
            >
              {q}
            </Link>
          ))}
        </div>

        <Link
          href='/workbench'
          className='mt-auto flex items-center justify-center gap-2 rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-navy/90'
        >
          Open Full Assistant
          <Icons.arrowRight className='h-4 w-4' />
        </Link>
      </CardContent>
    </Card>
  )
}
