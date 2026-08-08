'use client'

import { KpiGrid, type Kpi } from '@/components/dashboard/KpiGrid'
import { WorkforceInsights } from '@/components/dashboard/WorkforceInsights'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { StatusPill } from '@/components/ui/status-pill'
import { Icons } from '@/components/ui/icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface IntakeRow {
  id: string
  employee: string
  startDate: string
  manager: string
  docsStatus: 'Complete' | 'Missing' | 'In Review'
  setupStatus: 'Provisioned' | 'Pending' | 'Blocked'
}

const KPIS: Kpi[] = [
  { title: 'Pending Intake', value: '14', icon: Icons.intake, tone: 'navy' },
  { title: 'Docs Missing', value: '6', icon: Icons.fileText, tone: 'amber', trend: { value: '+2 vs last week', positive: false } },
  { title: 'Start Dates This Week', value: '9', icon: Icons.calendar, tone: 'cornflower' },
  { title: 'Auto-Provisioned', value: '58%', icon: Icons.zap, tone: 'emerald', trend: { value: '+6 pts', positive: true } },
]

const ROWS: IntakeRow[] = [
  { id: '1', employee: 'Marcus Webb', startDate: 'Aug 11, 2026', manager: 'Sara Klein', docsStatus: 'Missing', setupStatus: 'Pending' },
  { id: '2', employee: 'Yuki Tanaka', startDate: 'Aug 11, 2026', manager: 'Jon Ahn', docsStatus: 'In Review', setupStatus: 'Pending' },
  { id: '3', employee: 'Elena Popescu', startDate: 'Aug 12, 2026', manager: 'Sara Klein', docsStatus: 'Complete', setupStatus: 'Provisioned' },
  { id: '4', employee: 'Rahul Mehta', startDate: 'Aug 13, 2026', manager: 'Dana Brooks', docsStatus: 'Missing', setupStatus: 'Blocked' },
  { id: '5', employee: 'Grace Owusu', startDate: 'Aug 14, 2026', manager: 'Jon Ahn', docsStatus: 'Complete', setupStatus: 'Provisioned' },
]

const docsTone = { Complete: 'success', Missing: 'critical', 'In Review': 'medium' } as const
const setupTone = { Provisioned: 'success', Pending: 'medium', Blocked: 'critical' } as const

const COLUMNS: DataTableColumn<IntakeRow>[] = [
  { key: 'employee', header: 'Employee', render: (r) => <span className='font-medium text-brand-navy'>{r.employee}</span> },
  { key: 'startDate', header: 'Start Date', render: (r) => r.startDate },
  { key: 'manager', header: 'Manager', render: (r) => r.manager },
  { key: 'docsStatus', header: 'Docs Status', render: (r) => <StatusPill tone={docsTone[r.docsStatus]}>{r.docsStatus}</StatusPill> },
  { key: 'setupStatus', header: 'System Setup Status', render: (r) => <StatusPill tone={setupTone[r.setupStatus]}>{r.setupStatus}</StatusPill> },
]

export default function EmployeeIntakePage() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='font-display text-2xl font-bold tracking-tight text-brand-navy lg:text-3xl'>
          Employee Intake
        </h1>
        <p className='mt-1 text-sm text-brand-muted'>
          New-hire records entering the pipeline before and at day one.
        </p>
      </div>

      <KpiGrid kpis={KPIS} className='xl:grid-cols-4' />

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.intake className='h-4.5 w-4.5 text-brand-cornflower' strokeWidth={1.75} />
            Intake Pipeline
          </CardTitle>
          <span className='text-micro uppercase text-brand-muted'>{ROWS.length} in progress</span>
        </CardHeader>
        <CardContent className='p-0'>
          <DataTable columns={COLUMNS} rows={ROWS} getRowId={(r) => r.id} />
        </CardContent>
      </Card>

      <WorkforceInsights />
    </div>
  )
}
