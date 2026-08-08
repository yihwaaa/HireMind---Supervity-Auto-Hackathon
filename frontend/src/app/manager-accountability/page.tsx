'use client'

import { KpiGrid, type Kpi } from '@/components/dashboard/KpiGrid'
import { StatusPill } from '@/components/ui/status-pill'
import { Icons } from '@/components/ui/icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ============================================================================
// Manager Accountability
//
// Built directly on the Round 2 dataset's own fields — no invented schema:
//   - Peakon_Engagement.manager_response_days: blank = manager never
//     acknowledged that pulse (this IS the non-responsiveness signal)
//   - Manager_Directory: Employee_ID, Manager_WID, Org — a manager is also
//     a row here, so their own manager (skip-level) resolves via the same
//     table, keyed on the manager's own Employee_ID
//   - Locations_Entities: jurisdiction-scaled SLA windows (Policy 5)
//
// This directly targets two of the Round 2 dataset's seeded trap types
// (Field_Dictionary.csv, "SEEDED TRAP TYPES"):
//   "non-responsive manager who ignores nudges for an at-risk hire"
//   "false-positive risk signal (low score, benign comment) that should
//    NOT escalate"
//
// TODO once the Manager Accountability Operator is wired: replace BREACHES
// below with a fetch against GET /api/supervity/runs (filtered to this
// Operator's workflow), using the same output shape as MOCK_BREACHES so
// this page needs no structural changes — just swap the data source.
// ============================================================================

type Jurisdiction = 'MY' | 'SG' | 'IN' | 'PH' | 'AU'

interface LinkedPulse {
  employeeId: string
  employeeName: string
  milestone: string
  score: number
  sentiment: 'negative' | 'neutral' | 'positive'
  submittedAt: string
  daysUnacknowledged: number
}

interface ManagerBreach {
  id: string
  managerName: string
  managerWid: string
  org: string
  entityName: string
  jurisdiction: Jurisdiction
  slaWindowDays: number
  breachCount: number
  rollingWindowDays: number
  oldestUnacknowledgedDays: number
  skipLevelName: string
  skipLevelWid: string
  status: 'Pending Escalation' | 'Escalated' | 'Acknowledged'
  linkedPulses: LinkedPulse[]
}

const SLA_BY_ENTITY: Record<string, { entityName: string; jurisdiction: Jurisdiction; slaWindowDays: number }> = {
  MY: { entityName: 'Company Malaysia Sdn Bhd', jurisdiction: 'MY', slaWindowDays: 10 },
  SG: { entityName: 'Company Singapore Pte Ltd', jurisdiction: 'SG', slaWindowDays: 7 },
  IN: { entityName: 'Company India Pvt Ltd', jurisdiction: 'IN', slaWindowDays: 14 },
  PH: { entityName: 'Company Philippines Inc', jurisdiction: 'PH', slaWindowDays: 14 },
  AU: { entityName: 'Company Australia Pty Ltd', jurisdiction: 'AU', slaWindowDays: 7 },
}

// Demo data shaped exactly like the real Operator output will be — names
// (Kevin Goh/Sales, Anjali Prakash/Engineering, Hakim Iyer/Ops, Chloe
// Fernandez/Finance) are pulled from Manager_Directory.csv, not invented.
const MOCK_BREACHES: ManagerBreach[] = [
  {
    id: '1',
    managerName: 'Kevin Goh',
    managerWid: '006140bc-6dbd-2df9-29ec-9b1114eca3ab',
    org: 'Sales',
    ...SLA_BY_ENTITY.MY,
    breachCount: 3,
    rollingWindowDays: 30,
    oldestUnacknowledgedDays: 14,
    skipLevelName: 'Priya Ramasamy',
    skipLevelWid: 'a3f9...(resolved via Manager_Directory self-lookup)',
    status: 'Pending Escalation',
    linkedPulses: [
      { employeeId: 'EMP7014', employeeName: 'Nurul Hassan', milestone: 'Day 30', score: 3, sentiment: 'negative', submittedAt: '2026-07-25', daysUnacknowledged: 14 },
      { employeeId: 'EMP7021', employeeName: 'Wei Ling Tan', milestone: 'Day 7', score: 4, sentiment: 'negative', submittedAt: '2026-07-30', daysUnacknowledged: 9 },
      { employeeId: 'EMP7033', employeeName: 'Arjun Selvam', milestone: 'Day 60', score: 5, sentiment: 'neutral', submittedAt: '2026-08-01', daysUnacknowledged: 7 },
    ],
  },
  {
    id: '2',
    managerName: 'Hakim Iyer',
    managerWid: '35008368-2865-6974-3913-2ae9f9ebc0c7',
    org: 'Ops',
    ...SLA_BY_ENTITY.SG,
    breachCount: 2,
    rollingWindowDays: 30,
    oldestUnacknowledgedDays: 11,
    skipLevelName: 'Marcus Lim',
    skipLevelWid: 'b71c...(resolved via Manager_Directory self-lookup)',
    status: 'Escalated',
    linkedPulses: [
      { employeeId: 'EMP7040', employeeName: 'Grace Owusu', milestone: 'Day 30', score: 4, sentiment: 'negative', submittedAt: '2026-07-28', daysUnacknowledged: 11 },
      { employeeId: 'EMP7052', employeeName: 'Farid Osman', milestone: 'Day 7', score: 5, sentiment: 'negative', submittedAt: '2026-08-02', daysUnacknowledged: 6 },
    ],
  },
  {
    id: '3',
    managerName: 'Chloe Fernandez',
    managerWid: '89a5ed26-4b06-06c1-a33f-086260fc3bce',
    org: 'Finance',
    ...SLA_BY_ENTITY.IN,
    breachCount: 2,
    rollingWindowDays: 30,
    oldestUnacknowledgedDays: 15,
    skipLevelName: 'Deepa Krishnan',
    skipLevelWid: 'c92e...(resolved via Manager_Directory self-lookup)',
    status: 'Pending Escalation',
    linkedPulses: [
      { employeeId: 'EMP7061', employeeName: 'Ravi Chandran', milestone: 'Day 60', score: 3, sentiment: 'negative', submittedAt: '2026-07-24', daysUnacknowledged: 15 },
      { employeeId: 'EMP7067', employeeName: 'Aditi Menon', milestone: 'Day 30', score: 4, sentiment: 'negative', submittedAt: '2026-08-01', daysUnacknowledged: 7 },
    ],
  },
]

const statusTone = {
  'Pending Escalation': 'critical',
  Escalated: 'high',
  Acknowledged: 'success',
} as const

const KPIS: Kpi[] = [
  { title: 'Manager Ack SLA %', value: '71%', icon: Icons.accountability, tone: 'amber', trend: { value: '+9 pts vs last cohort', positive: true } },
  { title: 'Avg Days to Acknowledge', value: '6.4', icon: Icons.clock, tone: 'cornflower' },
  { title: 'Managers in Breach', value: `${MOCK_BREACHES.length}`, icon: Icons.nonResponsive, tone: 'red' },
  { title: 'Skip-Level Escalations (30d)', value: '5', icon: Icons.trendingUp, tone: 'navy' },
]

function BreachCard({ breach }: { breach: ManagerBreach }) {
  return (
    <div className='rounded-xl border border-border/60 bg-white/60 p-4'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <p className='font-medium text-brand-navy'>{breach.managerName}</p>
          <p className='text-xs text-brand-muted'>
            {breach.org} · {breach.entityName} ({breach.jurisdiction})
          </p>
        </div>
        <StatusPill tone={statusTone[breach.status]}>{breach.status}</StatusPill>
      </div>

      <div className='mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4'>
        <div>
          <p className='text-[11px] uppercase tracking-wide text-brand-muted'>Breach Count</p>
          <p className='font-semibold text-brand-navy'>
            {breach.breachCount} / {breach.rollingWindowDays}d window
          </p>
        </div>
        <div>
          <p className='text-[11px] uppercase tracking-wide text-brand-muted'>SLA (jurisdiction)</p>
          <p className='font-semibold text-brand-navy'>{breach.slaWindowDays} days</p>
        </div>
        <div>
          <p className='text-[11px] uppercase tracking-wide text-brand-muted'>Oldest Unacknowledged</p>
          <p className={cn('font-semibold', breach.oldestUnacknowledgedDays > breach.slaWindowDays ? 'text-red-600' : 'text-brand-navy')}>
            {breach.oldestUnacknowledgedDays} days
          </p>
        </div>
        <div>
          <p className='text-[11px] uppercase tracking-wide text-brand-muted'>Skip-Level</p>
          <p className='font-semibold text-brand-navy'>{breach.skipLevelName}</p>
        </div>
      </div>

      <div className='mt-3 border-t border-border/40 pt-3'>
        <p className='mb-2 text-xs font-medium text-brand-muted'>
          Linked pulses (excludes x_confidential=true and Score≥6 non-negative — Policies 3 &amp; 4)
        </p>
        <div className='space-y-1.5'>
          {breach.linkedPulses.map((p) => (
            <div key={p.employeeId} className='flex items-center justify-between text-xs'>
              <span className='text-brand-navy'>
                {p.employeeName} <span className='text-brand-muted'>({p.employeeId})</span> · {p.milestone}
              </span>
              <span className='flex items-center gap-3 text-brand-muted'>
                <span>Score {p.score}</span>
                <span className='capitalize'>{p.sentiment}</span>
                <span>{p.daysUnacknowledged}d unacknowledged</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {breach.status === 'Pending Escalation' && (
        <button className='mt-3 rounded-lg bg-brand-navy px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-navy/90'>
          Escalate to {breach.skipLevelName} →
        </button>
      )}
    </div>
  )
}

export default function ManagerAccountabilityPage() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='font-display text-2xl font-bold tracking-tight text-brand-navy lg:text-3xl'>
          Manager Accountability
        </h1>
        <p className='mt-1 text-sm text-brand-muted'>
          Managers with a pattern of unacknowledged at-risk pulses, escalated to their own
          manager — resolved via a self-lookup in Manager_Directory, not a hardcoded org chart.
        </p>
      </div>

      <KpiGrid kpis={KPIS} className='xl:grid-cols-4' />

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.nonResponsive className='h-4.5 w-4.5 text-red-500' strokeWidth={1.75} />
            Managers in Breach
          </CardTitle>
          <span className='text-micro uppercase text-brand-muted'>Policy 2 · 30-day rolling window</span>
        </CardHeader>
        <CardContent className='space-y-3'>
          {MOCK_BREACHES.map((breach) => (
            <BreachCard key={breach.id} breach={breach} />
          ))}
        </CardContent>
      </Card>

      <Card className='border-brand-cornflower/20 bg-brand-cornflower/5'>
        <CardContent className='p-4'>
          <p className='text-sm font-medium text-brand-navy'>How this is computed</p>
          <ul className='mt-2 space-y-1 text-sm text-brand-muted'>
            <li>• Signal: <code className='rounded bg-white px-1 py-0.5 text-xs'>Peakon_Engagement.manager_response_days</code> is blank</li>
            <li>• Qualifying pulse: <code className='rounded bg-white px-1 py-0.5 text-xs'>Score ≤ 5</code> OR <code className='rounded bg-white px-1 py-0.5 text-xs'>sentiment = negative</code>, excluding <code className='rounded bg-white px-1 py-0.5 text-xs'>x_confidential = true</code></li>
            <li>• Trigger: 2+ qualifying pulses per manager in a rolling 30-day window, unacknowledged past the jurisdiction&apos;s SLA</li>
            <li>• Skip-level resolution: the non-responsive manager&apos;s own <code className='rounded bg-white px-1 py-0.5 text-xs'>Employee_ID</code> looked up in <code className='rounded bg-white px-1 py-0.5 text-xs'>Manager_Directory</code></li>
          </ul>
          <p className='mt-3 text-xs text-brand-muted'>
            Full policy definitions (including the per-jurisdiction SLA table) live in{' '}
            <a href='/ai/policies' className='text-brand-cornflower underline underline-offset-2'>AI Policies</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
