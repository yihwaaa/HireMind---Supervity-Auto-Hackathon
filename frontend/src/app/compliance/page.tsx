'use client'

import { KpiGrid, type Kpi } from '@/components/dashboard/KpiGrid'
import { OnboardingHealth, type HealthMetric } from '@/components/dashboard/OnboardingHealth'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { StatusPill } from '@/components/ui/status-pill'
import { Icons } from '@/components/ui/icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ComplianceRow {
  id: string
  employee: string
  requirement: string
  dueDate: string
  status: 'Verified' | 'Overdue' | 'Expiring Soon'
}

const KPIS: Kpi[] = [
  { title: 'Overdue Items', value: '9', icon: Icons.compliance, tone: 'red', trend: { value: '-5 vs last week', positive: true } },
  { title: 'Expiring This Month', value: '14', icon: Icons.calendar, tone: 'amber' },
  { title: 'Fully Compliant %', value: '84%', icon: Icons.checkCircle, tone: 'emerald' },
]

const METRICS: HealthMetric[] = [
  { label: 'I-9 / Right-to-Work', value: 92, detail: '184 / 200 verified' },
  { label: 'Background Checks', value: 88, detail: '176 / 200 verified' },
  { label: 'Security Training', value: 71, detail: '142 / 200 completed' },
  { label: 'Policy Acknowledgements', value: 96, detail: '192 / 200 signed' },
]

const ROWS: ComplianceRow[] = [
  { id: '1', employee: 'Tom Whitfield', requirement: 'Security awareness training', dueDate: 'Jul 26, 2026', status: 'Overdue' },
  { id: '2', employee: 'Marcus Webb', requirement: 'I-9 verification', dueDate: 'Aug 6, 2026', status: 'Overdue' },
  { id: '3', employee: 'Yuki Tanaka', requirement: 'Data privacy policy sign-off', dueDate: 'Aug 12, 2026', status: 'Expiring Soon' },
  { id: '4', employee: 'Grace Owusu', requirement: 'Background check', dueDate: 'Aug 20, 2026', status: 'Verified' },
]

const statusTone = { Verified: 'success', Overdue: 'critical', 'Expiring Soon': 'high' } as const

const COLUMNS: DataTableColumn<ComplianceRow>[] = [
  { key: 'employee', header: 'Employee', render: (r) => <span className='font-medium text-brand-navy'>{r.employee}</span> },
  { key: 'requirement', header: 'Requirement', render: (r) => r.requirement },
  { key: 'dueDate', header: 'Due Date', render: (r) => r.dueDate },
  { key: 'status', header: 'Status', render: (r) => <StatusPill tone={statusTone[r.status]}>{r.status}</StatusPill> },
]

export default function ComplianceTrackerPage() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='font-display text-2xl font-bold tracking-tight text-brand-navy lg:text-3xl'>
          Compliance Tracker
        </h1>
        <p className='mt-1 text-sm text-brand-muted'>
          Required documentation and training obligations across the workforce.
        </p>
      </div>

      <KpiGrid kpis={KPIS} className='xl:grid-cols-3' />

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-5'>
        <OnboardingHealth metrics={METRICS} title='Compliance Categories' subtitle='Org-wide' className='xl:col-span-2' />
        <Card className='xl:col-span-3'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0'>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Icons.compliance className='h-4.5 w-4.5 text-brand-cornflower' strokeWidth={1.75} />
              Outstanding Requirements
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
