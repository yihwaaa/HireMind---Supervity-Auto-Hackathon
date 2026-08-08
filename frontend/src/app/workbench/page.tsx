'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusPill } from '@/components/ui/status-pill'
import { Icons } from '@/components/ui/icons'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

// ============================================================================
// Workbench — the human-in-the-loop queue.
//
// Two queues per the problem statement: at-risk-hire escalations (routed to
// managers / People Ops) and a strictly confidential queue for sensitive
// disclosures. Every item arrives with context + the agent's recommendation;
// a person approves, modifies, or rejects, and the decision is recorded.
//
// TODO once wired to the backend: replace ESCALATIONS with a fetch against
// GET /api/workbench/escalations, and POST the decision to
// /api/workbench/escalations/{id}/decision so it's persisted to the audit
// log (see app/services/audit.py) rather than only living in client state.
// ============================================================================

type Decision = 'pending' | 'approved' | 'modified' | 'rejected'

interface Escalation {
  id: string
  employee: string
  role: string
  riskDriver: string
  aiRecommendation: string
  assignedTo: string
  policyTriggered: string
  decision: Decision
}

interface ManagerEscalation {
  id: string
  managerName: string
  managerOrg: string
  skipLevelName: string
  breachSummary: string
  linkedHires: string
  policyTriggered: string
  decision: Decision
}

const INITIAL_ESCALATIONS: Escalation[] = [
  {
    id: '1',
    employee: 'Priya Nair',
    role: 'Product Marketing Manager',
    riskDriver: 'Engagement score dropped 34 pts in 2 weeks; risk score 76 (High)',
    aiRecommendation: 'Trigger a manager check-in within 48 hours and open an engagement follow-up.',
    assignedTo: 'People Ops — Dana Brooks',
    policyTriggered: 'Escalation threshold: risk score \u2265 70',
    decision: 'pending',
  },
  {
    id: '2',
    employee: 'Tom Whitfield',
    role: 'Account Executive · Sales',
    riskDriver: 'Compliance training overdue 9 days; jurisdiction deadline in 3 days',
    aiRecommendation: 'Notify hiring manager and auto-escalate to Legal if not resolved in 72 hours.',
    assignedTo: 'Manager — Jon Ahn',
    policyTriggered: 'Compliance deadline by jurisdiction: US-CA',
    decision: 'pending',
  },
]

// Same three breaches shown on the Manager Accountability page — this is
// the actionable queue version; that page is the evidence/detail view.
const INITIAL_MANAGER_ESCALATIONS: ManagerEscalation[] = [
  {
    id: 'm1',
    managerName: 'Kevin Goh',
    managerOrg: 'Sales · Company Malaysia Sdn Bhd (MY)',
    skipLevelName: 'Priya Ramasamy',
    breachSummary: '3 qualifying pulses unacknowledged past the 10-day MY SLA (14d, 9d, 7d oldest)',
    linkedHires: 'Nurul Hassan (EMP7014), Wei Ling Tan (EMP7021), Arjun Selvam (EMP7033)',
    policyTriggered: 'Manager Non-Responsiveness Pattern (skip-level escalation)',
    decision: 'pending',
  },
  {
    id: 'm2',
    managerName: 'Chloe Fernandez',
    managerOrg: 'Finance · Company India Pvt Ltd (IN)',
    skipLevelName: 'Deepa Krishnan',
    breachSummary: '2 qualifying pulses unacknowledged past the 14-day IN SLA (15d, 7d oldest)',
    linkedHires: 'Ravi Chandran (EMP7061), Aditi Menon (EMP7067)',
    policyTriggered: 'Manager Non-Responsiveness Pattern (skip-level escalation)',
    decision: 'pending',
  },
]

const decisionTone = {
  pending: 'medium',
  approved: 'success',
  modified: 'high',
  rejected: 'critical',
} as const

const decisionLabel = {
  pending: 'Pending Review',
  approved: 'Approved',
  modified: 'Modified',
  rejected: 'Rejected',
} as const

function EscalationRow({
  item,
  onDecide,
}: {
  item: Escalation
  onDecide: (id: string, decision: Decision) => void
}) {
  return (
    <div className='rounded-xl border border-border/60 bg-white/60 p-4'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <p className='font-medium text-brand-navy'>{item.employee}</p>
          <p className='text-xs text-brand-muted'>{item.role}</p>
        </div>
        <StatusPill tone={decisionTone[item.decision]}>{decisionLabel[item.decision]}</StatusPill>
      </div>

      <div className='mt-3 space-y-2 text-sm'>
        <p>
          <span className='font-medium text-brand-navy'>Risk driver: </span>
          <span className='text-brand-muted'>{item.riskDriver}</span>
        </p>
        <p>
          <span className='font-medium text-brand-navy'>AI recommendation: </span>
          <span className='text-brand-muted'>{item.aiRecommendation}</span>
        </p>
        <p className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-muted'>
          <span>Assigned: {item.assignedTo}</span>
          <span className='inline-flex items-center gap-1'>
            <Icons.shieldCheck className='h-3 w-3' /> Policy: {item.policyTriggered}
          </span>
        </p>
      </div>

      {item.decision === 'pending' && (
        <div className='mt-4 flex flex-wrap gap-2'>
          <button
            onClick={() => onDecide(item.id, 'approved')}
            className='rounded-lg bg-brand-navy px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-navy/90'
          >
            Approve
          </button>
          <button
            onClick={() => onDecide(item.id, 'modified')}
            className='rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-brand-navy transition-colors hover:bg-brand-cornflower/10'
          >
            Modify
          </button>
          <button
            onClick={() => onDecide(item.id, 'rejected')}
            className='rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50'
          >
            Reject
          </button>
        </div>
      )}
    </div>
  )
}

function ManagerEscalationRow({
  item,
  onDecide,
}: {
  item: ManagerEscalation
  onDecide: (id: string, decision: Decision) => void
}) {
  return (
    <div className='rounded-xl border border-border/60 bg-white/60 p-4'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <p className='font-medium text-brand-navy'>{item.managerName}</p>
          <p className='text-xs text-brand-muted'>{item.managerOrg}</p>
        </div>
        <StatusPill tone={decisionTone[item.decision]}>{decisionLabel[item.decision]}</StatusPill>
      </div>

      <div className='mt-3 space-y-2 text-sm'>
        <p>
          <span className='font-medium text-brand-navy'>Breach: </span>
          <span className='text-brand-muted'>{item.breachSummary}</span>
        </p>
        <p>
          <span className='font-medium text-brand-navy'>Linked hires: </span>
          <span className='text-brand-muted'>{item.linkedHires}</span>
        </p>
        <p className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-muted'>
          <span>Resolved skip-level: {item.skipLevelName}</span>
          <span className='inline-flex items-center gap-1'>
            <Icons.shieldCheck className='h-3 w-3' /> Policy: {item.policyTriggered}
          </span>
        </p>
      </div>

      {item.decision === 'pending' && (
        <div className='mt-4 flex flex-wrap gap-2'>
          <button
            onClick={() => onDecide(item.id, 'approved')}
            className='rounded-lg bg-brand-navy px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-navy/90'
          >
            Escalate to {item.skipLevelName}
          </button>
          <button
            onClick={() => onDecide(item.id, 'modified')}
            className='rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-brand-navy transition-colors hover:bg-brand-cornflower/10'
          >
            Hold — nudge manager once more
          </button>
          <button
            onClick={() => onDecide(item.id, 'rejected')}
            className='rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50'
          >
            Dismiss (false positive)
          </button>
        </div>
      )}
    </div>
  )
}

export default function WorkbenchPage() {
  const [escalations, setEscalations] = useState<Escalation[]>(INITIAL_ESCALATIONS)
  const [managerEscalations, setManagerEscalations] = useState<ManagerEscalation[]>(
    INITIAL_MANAGER_ESCALATIONS
  )

  const handleDecide = (id: string, decision: Decision) => {
    const item = escalations.find((e) => e.id === id)
    setEscalations((prev) =>
      prev.map((e) => (e.id === id ? { ...e, decision } : e))
    )
    const verb = decision === 'approved' ? 'Approved' : decision === 'rejected' ? 'Rejected' : 'Marked for modification'
    toast.success(`${verb}: ${item?.employee}`, {
      description: 'Decision recorded to the audit log.',
    })
  }

  const handleDecideManager = (id: string, decision: Decision) => {
    const item = managerEscalations.find((e) => e.id === id)
    setManagerEscalations((prev) =>
      prev.map((e) => (e.id === id ? { ...e, decision } : e))
    )
    const verb = decision === 'approved' ? 'Escalated' : decision === 'rejected' ? 'Dismissed as false positive' : 'Held for one more nudge'
    toast.success(`${verb}: ${item?.managerName}`, {
      description: 'Decision recorded to the audit log.',
    })
  }

  const pendingCount =
    escalations.filter((e) => e.decision === 'pending').length +
    managerEscalations.filter((e) => e.decision === 'pending').length
  const resolvedToday =
    escalations.filter((e) => e.decision !== 'pending').length +
    managerEscalations.filter((e) => e.decision !== 'pending').length

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='font-display text-2xl font-bold tracking-tight text-brand-navy lg:text-3xl'>
          Workbench
        </h1>
        <p className='mt-1 text-sm text-brand-muted'>
          The human queue — every item arrives with full context and the agent&apos;s
          recommendation. A person approves, modifies, or rejects, and the workflow continues.
        </p>
      </div>

      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <Card>
          <CardContent className='p-4'>
            <p className='text-xs font-medium uppercase tracking-wide text-brand-muted'>Pending Review</p>
            <p className='mt-2 font-display text-2xl font-bold text-brand-navy'>{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <p className='text-xs font-medium uppercase tracking-wide text-brand-muted'>Resolved This Session</p>
            <p className='mt-2 font-display text-2xl font-bold text-brand-navy'>{resolvedToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <p className='text-xs font-medium uppercase tracking-wide text-brand-muted'>Confidential Items</p>
            <p className='mt-2 font-display text-2xl font-bold text-brand-navy'>1</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <p className='text-xs font-medium uppercase tracking-wide text-brand-muted'>Avg Time to Decision</p>
            <p className='mt-2 font-display text-2xl font-bold text-brand-navy'>4.2h</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.risk className='h-4.5 w-4.5 text-red-500' strokeWidth={1.75} />
            At-Risk Hire Escalations
          </CardTitle>
          <span className='text-micro uppercase text-brand-muted'>Routed to managers &amp; People Ops</span>
        </CardHeader>
        <CardContent className='space-y-3'>
          {escalations.map((item) => (
            <EscalationRow key={item.id} item={item} onDecide={handleDecide} />
          ))}
        </CardContent>
      </Card>

      <Card className='border-red-100'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.nonResponsive className='h-4.5 w-4.5 text-red-500' strokeWidth={1.75} />
            Manager Accountability Escalations
          </CardTitle>
          <span className='text-micro uppercase text-brand-muted'>
            Skip-level, resolved via Manager_Directory
          </span>
        </CardHeader>
        <CardContent className='space-y-3'>
          {managerEscalations.map((item) => (
            <ManagerEscalationRow key={item.id} item={item} onDecide={handleDecideManager} />
          ))}
          <p className='pt-1 text-xs text-brand-muted'>
            Full breach evidence (linked pulses, SLA math) on the{' '}
            <a href='/manager-accountability' className='text-brand-cornflower underline underline-offset-2'>
              Manager Accountability
            </a>{' '}
            page.
          </p>
        </CardContent>
      </Card>

      <Card className='border-brand-navy/10'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.lock className='h-4.5 w-4.5 text-brand-navy' strokeWidth={1.75} />
            Confidential Disclosures
          </CardTitle>
          <span className='text-micro uppercase text-brand-muted'>Restricted queue</span>
        </CardHeader>
        <CardContent>
          <div className={cn(
            'flex items-center gap-4 rounded-xl border border-dashed border-border/80 bg-muted/30 p-6'
          )}>
            <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-navy/5'>
              <Icons.lock className='h-5 w-5 text-brand-navy' strokeWidth={1.75} />
            </div>
            <div>
              <p className='text-sm font-medium text-brand-navy'>1 sensitive disclosure awaiting review</p>
              <p className='mt-0.5 text-sm text-brand-muted'>
                Content is hard-routed to this confidential path and never surfaces on the
                dashboard, AI Insights, or the AI Manager. Only the People Ops Lead role can open it.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
