'use client'

import { KpiGrid, type Kpi } from '@/components/dashboard/KpiGrid'
import { EmployeeRiskRadar } from '@/components/dashboard/EmployeeRiskRadar'
import { AIRecommendations } from '@/components/dashboard/AIRecommendations'
import { Icons } from '@/components/ui/icons'

const KPIS: Kpi[] = [
  { title: 'High Risk Employees', value: '5', icon: Icons.risk, tone: 'red', trend: { value: '+2 vs last week', positive: false } },
  { title: 'Open Interventions', value: '5', icon: Icons.sparkles, tone: 'cornflower' },
  { title: 'Resolved This Month', value: '18', icon: Icons.checkCircle, tone: 'emerald', trend: { value: '+6', positive: true } },
]

export default function RiskInterventionCenterPage() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='font-display text-2xl font-bold tracking-tight text-brand-navy lg:text-3xl'>
          Risk & Intervention Center
        </h1>
        <p className='mt-1 text-sm text-brand-muted'>
          The full, unfiltered risk radar and AI intervention backlog across every domain.
        </p>
      </div>

      <KpiGrid kpis={KPIS} className='xl:grid-cols-3' />

      <EmployeeRiskRadar title='All Flagged Employees' />

      <AIRecommendations title='Full Intervention Backlog' />
    </div>
  )
}
