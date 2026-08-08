'use client'

import { KpiGrid, type Kpi } from '@/components/dashboard/KpiGrid'
import { OperationalTrendChart, type TrendPoint } from '@/components/dashboard/OperationalTrendChart'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { StatusPill } from '@/components/ui/status-pill'
import { Icons } from '@/components/ui/icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PulseRow {
  id: string
  employee: string
  score: number
  delta: number
  lastSurvey: string
}

const KPIS: Kpi[] = [
  { title: 'Avg Engagement Score', value: '76', icon: Icons.engagement, tone: 'emerald', trend: { value: '+3 pts', positive: true } },
  { title: 'Employees Trending Down', value: '8', icon: Icons.alertTriangle, tone: 'amber' },
  { title: 'Pulse Surveys Sent', value: '200', icon: Icons.mail, tone: 'cornflower' },
]

const TREND: TrendPoint[] = [
  { week: 'Wk 1', onTrack: 74, atRisk: 26 },
  { week: 'Wk 2', onTrack: 71, atRisk: 29 },
  { week: 'Wk 3', onTrack: 69, atRisk: 31 },
  { week: 'Wk 4', onTrack: 73, atRisk: 27 },
  { week: 'Wk 5', onTrack: 76, atRisk: 24 },
  { week: 'Wk 6', onTrack: 76, atRisk: 24 },
]

const ROWS: PulseRow[] = [
  { id: '1', employee: 'Priya Nair', score: 42, delta: -34, lastSurvey: 'Aug 1, 2026' },
  { id: '2', employee: 'Tom Whitfield', score: 58, delta: -12, lastSurvey: 'Jul 29, 2026' },
  { id: '3', employee: 'Layla Haddad', score: 61, delta: -6, lastSurvey: 'Jul 30, 2026' },
  { id: '4', employee: 'Elena Popescu', score: 88, delta: +5, lastSurvey: 'Aug 2, 2026' },
]

const COLUMNS: DataTableColumn<PulseRow>[] = [
  { key: 'employee', header: 'Employee', render: (r) => <span className='font-medium text-brand-navy'>{r.employee}</span> },
  { key: 'score', header: 'Score', render: (r) => <span className='font-semibold tabular-nums text-brand-navy'>{r.score}</span> },
  {
    key: 'delta',
    header: 'Δ (14d)',
    render: (r) => (
      <StatusPill tone={r.delta < 0 ? 'critical' : 'success'}>
        {r.delta > 0 ? `+${r.delta}` : r.delta}
      </StatusPill>
    ),
  },
  { key: 'lastSurvey', header: 'Last Survey', render: (r) => r.lastSurvey },
]

export default function EngagementPulsePage() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='font-display text-2xl font-bold tracking-tight text-brand-navy lg:text-3xl'>
          Engagement Pulse
        </h1>
        <p className='mt-1 text-sm text-brand-muted'>
          Engagement-score trends and week-over-week drops worth a check-in.
        </p>
      </div>

      <KpiGrid kpis={KPIS} className='xl:grid-cols-3' />

      <OperationalTrendChart
        data={TREND}
        title='Engagement Score Trend'
        description='Org-wide average engagement score, by week'
        primaryLabel='Engaged'
        secondaryLabel='At-Risk'
      />

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.engagement className='h-4.5 w-4.5 text-brand-cornflower' strokeWidth={1.75} />
            Largest Score Movements
          </CardTitle>
          <span className='text-micro uppercase text-brand-muted'>{ROWS.length} shown</span>
        </CardHeader>
        <CardContent className='p-0'>
          <DataTable columns={COLUMNS} rows={ROWS} getRowId={(r) => r.id} />
        </CardContent>
      </Card>
    </div>
  )
}
