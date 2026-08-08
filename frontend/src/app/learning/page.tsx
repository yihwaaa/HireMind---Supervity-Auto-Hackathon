'use client'

import { KpiGrid, type Kpi } from '@/components/dashboard/KpiGrid'
import { OnboardingHealth, type HealthMetric } from '@/components/dashboard/OnboardingHealth'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { Icons } from '@/components/ui/icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface LearningRow {
  id: string
  employee: string
  module: string
  progress: number
  deadline: string
}

const KPIS: Kpi[] = [
  { title: 'Modules Overdue', value: '11', icon: Icons.learning, tone: 'red' },
  { title: 'Avg Completion %', value: '64%', icon: Icons.checkCircle, tone: 'cornflower' },
  { title: 'Certifications Pending', value: '5', icon: Icons.fileText, tone: 'amber' },
]

const METRICS: HealthMetric[] = [
  { label: 'Onboarding Fundamentals', value: 91, detail: '182 / 200 completed' },
  { label: 'Security & Compliance', value: 71, detail: '142 / 200 completed' },
  { label: 'Role-Specific Certification', value: 52, detail: '104 / 200 completed' },
  { label: 'Culture & Values', value: 88, detail: '176 / 200 completed' },
]

const ROWS: LearningRow[] = [
  { id: '1', employee: 'Diego Ferreira', module: 'Cloud Security Certification', progress: 40, deadline: 'Aug 8, 2026' },
  { id: '2', employee: 'Priya Nair', module: 'Brand & Messaging Guidelines', progress: 65, deadline: 'Aug 10, 2026' },
  { id: '3', employee: 'Layla Haddad', module: 'Customer Support Playbook', progress: 30, deadline: 'Aug 6, 2026' },
  { id: '4', employee: 'Elena Popescu', module: 'Onboarding Fundamentals', progress: 100, deadline: 'Aug 1, 2026' },
]

const COLUMNS: DataTableColumn<LearningRow>[] = [
  { key: 'employee', header: 'Employee', render: (r) => <span className='font-medium text-brand-navy'>{r.employee}</span> },
  { key: 'module', header: 'Module', render: (r) => r.module },
  {
    key: 'progress',
    header: 'Progress',
    render: (r) => (
      <div className='flex items-center gap-2'>
        <div className='h-1.5 w-24 overflow-hidden rounded-full bg-muted'>
          <div
            className='h-full rounded-full bg-brand-cornflower'
            style={{ width: `${r.progress}%` }}
          />
        </div>
        <span className='text-xs font-medium tabular-nums text-brand-navy'>{r.progress}%</span>
      </div>
    ),
  },
  { key: 'deadline', header: 'Deadline', render: (r) => r.deadline },
]

export default function LearningProgressPage() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='font-display text-2xl font-bold tracking-tight text-brand-navy lg:text-3xl'>
          Learning Progress
        </h1>
        <p className='mt-1 text-sm text-brand-muted'>
          Required-learning completion across onboarding tracks.
        </p>
      </div>

      <KpiGrid kpis={KPIS} className='xl:grid-cols-3' />

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-5'>
        <OnboardingHealth metrics={METRICS} title='Learning Tracks' subtitle='Org-wide' className='xl:col-span-2' />
        <Card className='xl:col-span-3'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0'>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Icons.learning className='h-4.5 w-4.5 text-brand-cornflower' strokeWidth={1.75} />
              In-Progress Modules
            </CardTitle>
            <span className='text-micro uppercase text-brand-muted'>{ROWS.length} shown</span>
          </CardHeader>
          <CardContent className='p-0'>
            <DataTable columns={COLUMNS} rows={ROWS} getRowId={(r) => r.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
