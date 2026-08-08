'use client'

import { KpiGrid, type Kpi } from '@/components/dashboard/KpiGrid'
import { AIRecommendations } from '@/components/dashboard/AIRecommendations'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { StatusPill } from '@/components/ui/status-pill'
import { Icons } from '@/components/ui/icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ProvisioningRow {
  id: string
  employee: string
  system: string
  requested: string
  slaStatus: 'On Time' | 'At Risk' | 'Breached'
  blocker: string
}

const KPIS: Kpi[] = [
  { title: 'Blocked Requests', value: '12', icon: Icons.provisioning, tone: 'amber', trend: { value: '+4 vs last week', positive: false } },
  { title: 'Avg Fulfillment Time', value: '2.3 days', icon: Icons.clock, tone: 'cornflower' },
  { title: 'SLA Breaches', value: '3', icon: Icons.alertTriangle, tone: 'red' },
]

const ROWS: ProvisioningRow[] = [
  { id: '1', employee: 'Diego Ferreira', system: 'VPN + Corp Repo', requested: 'Jul 24, 2026', slaStatus: 'Breached', blocker: 'Pending security review' },
  { id: '2', employee: 'Yuki Tanaka', system: 'Salesforce', requested: 'Jul 30, 2026', slaStatus: 'At Risk', blocker: 'Manager approval pending' },
  { id: '3', employee: 'Rahul Mehta', system: 'AWS Console', requested: 'Aug 1, 2026', slaStatus: 'At Risk', blocker: 'Awaiting license seat' },
  { id: '4', employee: 'Elena Popescu', system: 'Slack + Email', requested: 'Aug 2, 2026', slaStatus: 'On Time', blocker: '—' },
  { id: '5', employee: 'Grace Owusu', system: 'Figma', requested: 'Aug 2, 2026', slaStatus: 'On Time', blocker: '—' },
]

const slaTone = { 'On Time': 'success', 'At Risk': 'high', Breached: 'critical' } as const

const COLUMNS: DataTableColumn<ProvisioningRow>[] = [
  { key: 'employee', header: 'Employee', render: (r) => <span className='font-medium text-brand-navy'>{r.employee}</span> },
  { key: 'system', header: 'System', render: (r) => r.system },
  { key: 'requested', header: 'Requested', render: (r) => r.requested },
  { key: 'slaStatus', header: 'SLA Status', render: (r) => <StatusPill tone={slaTone[r.slaStatus]}>{r.slaStatus}</StatusPill> },
  { key: 'blocker', header: 'Blocker Reason', render: (r) => <span className='text-brand-muted'>{r.blocker}</span> },
]

export default function ProvisioningGuardianPage() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='font-display text-2xl font-bold tracking-tight text-brand-navy lg:text-3xl'>
          Provisioning Guardian
        </h1>
        <p className='mt-1 text-sm text-brand-muted'>
          IT and system access requests blocking new hires from doing their job.
        </p>
      </div>

      <KpiGrid kpis={KPIS} className='xl:grid-cols-3' />

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
        <Card className='xl:col-span-2'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0'>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Icons.provisioning className='h-4.5 w-4.5 text-brand-cornflower' strokeWidth={1.75} />
              Access Requests
            </CardTitle>
            <span className='text-micro uppercase text-brand-muted'>{ROWS.length} open</span>
          </CardHeader>
          <CardContent className='p-0'>
            <DataTable columns={COLUMNS} rows={ROWS} getRowId={(r) => r.id} />
          </CardContent>
        </Card>
        <AIRecommendations domainFilter='provisioning' title='Provisioning Actions' className='xl:col-span-1' />
      </div>
    </div>
  )
}
