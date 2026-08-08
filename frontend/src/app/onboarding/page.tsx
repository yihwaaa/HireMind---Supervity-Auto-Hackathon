'use client'

import { KpiGrid, type Kpi } from '@/components/dashboard/KpiGrid'
import { OnboardingHealth } from '@/components/dashboard/OnboardingHealth'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { StatusPill } from '@/components/ui/status-pill'
import { Icons } from '@/components/ui/icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TaskRow {
  id: string
  employee: string
  task: string
  owner: string
  dueDate: string
  status: 'On Track' | 'Overdue' | 'Blocked'
}

const KPIS: Kpi[] = [
  { title: 'Tasks Overdue', value: '23', icon: Icons.clock, tone: 'red', trend: { value: '+4 vs last week', positive: false } },
  { title: 'Avg Days to Complete', value: '11.4', icon: Icons.auditor, tone: 'cornflower' },
  { title: 'Stalled Employees', value: '6', icon: Icons.alertTriangle, tone: 'amber' },
]

const ROWS: TaskRow[] = [
  { id: '1', employee: 'Marcus Webb', task: 'Sign employment agreement', owner: 'HR Ops', dueDate: 'Aug 5, 2026', status: 'Overdue' },
  { id: '2', employee: 'Diego Ferreira', task: 'Complete security training', owner: 'IT Security', dueDate: 'Aug 6, 2026', status: 'Blocked' },
  { id: '3', employee: 'Priya Nair', task: 'Meet with team lead', owner: 'Priya Nair', dueDate: 'Aug 7, 2026', status: 'On Track' },
  { id: '4', employee: 'Tom Whitfield', task: 'Submit tax forms', owner: 'Payroll', dueDate: 'Aug 3, 2026', status: 'Overdue' },
  { id: '5', employee: 'Grace Owusu', task: 'Complete benefits enrollment', owner: 'Grace Owusu', dueDate: 'Aug 9, 2026', status: 'On Track' },
]

const statusTone = { 'On Track': 'success', Overdue: 'critical', Blocked: 'high' } as const

const COLUMNS: DataTableColumn<TaskRow>[] = [
  { key: 'employee', header: 'Employee', render: (r) => <span className='font-medium text-brand-navy'>{r.employee}</span> },
  { key: 'task', header: 'Task', render: (r) => r.task },
  { key: 'owner', header: 'Owner', render: (r) => r.owner },
  { key: 'dueDate', header: 'Due Date', render: (r) => r.dueDate },
  { key: 'status', header: 'Status', render: (r) => <StatusPill tone={statusTone[r.status]}>{r.status}</StatusPill> },
]

export default function OnboardingAuditorPage() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='font-display text-2xl font-bold tracking-tight text-brand-navy lg:text-3xl'>
          Onboarding Auditor
        </h1>
        <p className='mt-1 text-sm text-brand-muted'>
          Task-level onboarding progress and audit trail per employee.
        </p>
      </div>

      <KpiGrid kpis={KPIS} className='xl:grid-cols-3' />

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-5'>
        <OnboardingHealth className='xl:col-span-2' />
        <Card className='xl:col-span-3'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0'>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Icons.auditor className='h-4.5 w-4.5 text-brand-cornflower' strokeWidth={1.75} />
              Task Ledger
            </CardTitle>
            <span className='text-micro uppercase text-brand-muted'>{ROWS.length} tasks shown</span>
          </CardHeader>
          <CardContent className='p-0'>
            <DataTable columns={COLUMNS} rows={ROWS} getRowId={(r) => r.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
