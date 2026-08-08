'use client'

import { KpiGrid, type Kpi } from '@/components/dashboard/KpiGrid'
import { AIRecommendations } from '@/components/dashboard/AIRecommendations'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { StatusPill } from '@/components/ui/status-pill'
import { Icons } from '@/components/ui/icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PayrollRow {
  id: string
  employee: string
  exceptionType: string
  payCycle: string
  daysOpen: number
  severity: 'Critical' | 'High' | 'Medium'
}

const KPIS: Kpi[] = [
  { title: 'Open Exceptions', value: '7', icon: Icons.payroll, tone: 'amber', trend: { value: '-3 vs last week', positive: true } },
  { title: '$ At Risk', value: '$18.4K', icon: Icons.alertTriangle, tone: 'red' },
  { title: 'Employees Affected', value: '7', icon: Icons.users, tone: 'cornflower' },
]

const ROWS: PayrollRow[] = [
  { id: '1', employee: 'Amara Chen', exceptionType: 'First paycheck exception', payCycle: 'Aug 2026 · Cycle 1', daysOpen: 6, severity: 'Critical' },
  { id: '2', employee: 'Tom Whitfield', exceptionType: 'Missing tax withholding form', payCycle: 'Aug 2026 · Cycle 1', daysOpen: 4, severity: 'High' },
  { id: '3', employee: 'Layla Haddad', exceptionType: 'Incorrect bank details', payCycle: 'Jul 2026 · Cycle 2', daysOpen: 9, severity: 'High' },
  { id: '4', employee: 'Rahul Mehta', exceptionType: 'Benefits deduction mismatch', payCycle: 'Aug 2026 · Cycle 1', daysOpen: 2, severity: 'Medium' },
]

const severityTone = { Critical: 'critical', High: 'high', Medium: 'medium' } as const

const COLUMNS: DataTableColumn<PayrollRow>[] = [
  { key: 'employee', header: 'Employee', render: (r) => <span className='font-medium text-brand-navy'>{r.employee}</span> },
  { key: 'exceptionType', header: 'Exception Type', render: (r) => r.exceptionType },
  { key: 'payCycle', header: 'Pay Cycle', render: (r) => r.payCycle },
  { key: 'daysOpen', header: 'Days Open', render: (r) => <span className='font-semibold tabular-nums text-brand-navy'>{r.daysOpen}</span> },
  { key: 'severity', header: 'Severity', render: (r) => <StatusPill tone={severityTone[r.severity]}>{r.severity}</StatusPill> },
]

export default function PayrollMonitorPage() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='font-display text-2xl font-bold tracking-tight text-brand-navy lg:text-3xl'>
          Payroll Monitor
        </h1>
        <p className='mt-1 text-sm text-brand-muted'>
          Open payroll exceptions across active new hires, ranked by days open.
        </p>
      </div>

      <KpiGrid kpis={KPIS} className='xl:grid-cols-3' />

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
        <Card className='xl:col-span-2'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0'>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Icons.payroll className='h-4.5 w-4.5 text-brand-cornflower' strokeWidth={1.75} />
              Payroll Exceptions
            </CardTitle>
            <span className='text-micro uppercase text-brand-muted'>{ROWS.length} open</span>
          </CardHeader>
          <CardContent className='p-0'>
            <DataTable columns={COLUMNS} rows={ROWS} getRowId={(r) => r.id} />
          </CardContent>
        </Card>
        <AIRecommendations domainFilter='payroll' title='Payroll Actions' className='xl:col-span-1' />
      </div>
    </div>
  )
}
