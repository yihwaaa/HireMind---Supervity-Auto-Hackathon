'use client'

import { KpiGrid } from '@/components/dashboard/KpiGrid'
import { EmployeeRiskRadar } from '@/components/dashboard/EmployeeRiskRadar'
import { OnboardingHealth } from '@/components/dashboard/OnboardingHealth'
import { AIRecommendations } from '@/components/dashboard/AIRecommendations'
import { WorkforceInsights } from '@/components/dashboard/WorkforceInsights'
import { OperationalTrendChart } from '@/components/dashboard/OperationalTrendChart'
import { AIAssistantPanel } from '@/components/dashboard/AIAssistantPanel'

// Executive Overview — HireMind AI Command Center homepage.
// Layout: KPI strip -> Risk Radar -> Onboarding Health + AI Recommendations
// -> Workforce Insights -> Analytics Area | AI Assistant Panel.
export default function HomePage() {
  return (
    <div className='space-y-6'>
      {/* Page header */}
      <div>
        <h1 className='font-display text-2xl font-bold tracking-tight text-brand-navy lg:text-3xl'>
          Executive Overview
        </h1>
        <p className='mt-1 text-sm text-brand-muted'>
          Unified operational view across intake, onboarding, payroll, provisioning,
          compliance, learning, engagement, and attrition risk.
        </p>
      </div>

      {/* KPI Cards */}
      <KpiGrid />

      {/* Employee Risk Radar — top priority section */}
      <EmployeeRiskRadar />

      {/* Onboarding Health + AI Recommendations */}
      <div className='grid grid-cols-1 gap-6 xl:grid-cols-5'>
        <OnboardingHealth className='xl:col-span-2' />
        <AIRecommendations className='xl:col-span-3' />
      </div>

      {/* Workforce Insights */}
      <WorkforceInsights />

      {/* Analytics Area | AI Assistant Panel */}
      <div className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
        <OperationalTrendChart className='xl:col-span-2' />
        <AIAssistantPanel className='xl:col-span-1' />
      </div>
    </div>
  )
}
