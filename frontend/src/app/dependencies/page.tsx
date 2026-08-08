'use client'

import { KpiGrid, type Kpi } from '@/components/dashboard/KpiGrid'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { StatusPill } from '@/components/ui/status-pill'
import { Icons } from '@/components/ui/icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DependencyRow {
  id: string
  employee: string
  blockingTeam: string
  dependency: string
  daysWaiting: number
}

const KPIS: Kpi[] = [
  { title: 'Cross-Team Blockers', value: '8', icon: Icons.dependency, tone: 'amber' },
  { title: 'Longest Wait', value: '12 days', icon: Icons.clock, tone: 'red' },
  { title: 'Teams Involved', value: '4', icon: Icons.building, tone: 'cornflower' },
]

const ROWS: DependencyRow[] = [
  { id: '1', employee: 'Diego Ferreira', blockingTeam: 'IT Security', dependency: 'VPN + repo access approval', daysWaiting: 12 },
  { id: '2', employee: 'Rahul Mehta', blockingTeam: 'Finance', dependency: 'Expense system license', daysWaiting: 8 },
  { id: '3', employee: 'Yuki Tanaka', blockingTeam: 'Facilities', dependency: 'Desk & badge assignment', daysWaiting: 5 },
  { id: '4', employee: 'Marcus Webb', blockingTeam: 'IT Security', dependency: 'Laptop imaging queue', daysWaiting: 3 },
]

function waitTone(days: number) {
  if (days >= 10) return 'critical' as const
  if (days >= 5) return 'high' as const
  return 'medium' as const
}

const COLUMNS: DataTableColumn<DependencyRow>[] = [
  { key: 'employee', header: 'Employee', render: (r) => <span className='font-medium text-brand-navy'>{r.employee}</span> },
  { key: 'blockingTeam', header: 'Blocking Team', render: (r) => r.blockingTeam },
  { key: 'dependency', header: 'Dependency', render: (r) => r.dependency },
  {
    key: 'daysWaiting',
    header: 'Days Waiting',
    render: (r) => <StatusPill tone={waitTone(r.daysWaiting)}>{r.daysWaiting} days</StatusPill>,
  },
]

export default function CrossTeamDependencyWatchPage() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='font-display text-2xl font-bold tracking-tight text-brand-navy lg:text-3xl'>
          Cross-Team Dependency Watch
        </h1>
        <p className='mt-1 text-sm text-brand-muted'>
          Where onboarding is blocked by another team — IT, Finance, or Facilities.
        </p>
      </div>

      <KpiGrid kpis={KPIS} className='xl:grid-cols-3' />

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.dependency className='h-4.5 w-4.5 text-brand-cornflower' strokeWidth={1.75} />
            Open Dependencies
          </CardTitle>
          <span className='text-micro uppercase text-brand-muted'>Sorted by wait time</span>
        </CardHeader>
        <CardContent className='p-0'>
          <DataTable columns={COLUMNS} rows={ROWS} getRowId={(r) => r.id} />
        </CardContent>
      </Card>
    </div>
  )
}
