'use client'

import { KpiGrid, type Kpi } from '@/components/dashboard/KpiGrid'
import { EmployeeRiskRadar, type RiskRow } from '@/components/dashboard/EmployeeRiskRadar'
import { AIRecommendations } from '@/components/dashboard/AIRecommendations'
import { Icons } from '@/components/ui/icons'

const KPIS: Kpi[] = [
  { title: 'Predicted Attrition Risk', value: '9%', icon: Icons.retention, tone: 'amber', trend: { value: '+1.2 pts', positive: false } },
  { title: 'Interventions Active', value: '4', icon: Icons.zap, tone: 'cornflower' },
  { title: 'Interventions Successful', value: '71%', icon: Icons.checkCircle, tone: 'emerald' },
]

const RISK_ROWS: RiskRow[] = [
  {
    employee: 'Priya Nair',
    role: 'Product Marketing Manager',
    riskScore: 76,
    riskLevel: 'High',
    driver: 'Engagement score dropped 34 pts in 2 weeks',
    action: 'Trigger Engagement Follow-Up',
  },
  {
    employee: 'Layla Haddad',
    role: 'Support Specialist · CS',
    riskScore: 58,
    riskLevel: 'Medium',
    driver: 'No manager 1:1 logged since start',
    action: 'Launch Retention Intervention',
  },
  {
    employee: 'Tom Whitfield',
    role: 'Account Executive · Sales',
    riskScore: 54,
    riskLevel: 'Medium',
    driver: 'Below-average ramp velocity vs. cohort',
    action: 'Schedule Manager Check-In',
  },
]

export default function RetentionIntelligencePage() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='font-display text-2xl font-bold tracking-tight text-brand-navy lg:text-3xl'>
          Retention Intelligence
        </h1>
        <p className='mt-1 text-sm text-brand-muted'>
          Attrition-risk forecasting and active retention interventions.
        </p>
      </div>

      <KpiGrid kpis={KPIS} className='xl:grid-cols-3' />

      <EmployeeRiskRadar
        rows={RISK_ROWS}
        title='Attrition Risk Radar'
        subtitle={`${RISK_ROWS.length} flagged for retention`}
      />

      <AIRecommendations domainFilter='retention' title='Retention Interventions' />
    </div>
  )
}
