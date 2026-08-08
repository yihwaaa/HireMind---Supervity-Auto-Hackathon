'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

export type RiskLevel = 'Critical' | 'High' | 'Medium'

export interface RiskRow {
  employee: string
  role: string
  riskScore: number
  riskLevel: RiskLevel
  driver: string
  action: string
}

const DEFAULT_RISK_ROWS: RiskRow[] = [
  {
    employee: 'Amara Chen',
    role: 'Senior Data Analyst · Finance',
    riskScore: 91,
    riskLevel: 'Critical',
    driver: 'Payroll exception unresolved 6 days',
    action: 'Escalate Payroll Exception',
  },
  {
    employee: 'Diego Ferreira',
    role: 'DevOps Engineer · Platform',
    riskScore: 84,
    riskLevel: 'Critical',
    driver: 'Provisioning blocked — no VPN access day 12',
    action: 'Escalate Provisioning Blocker',
  },
  {
    employee: 'Priya Nair',
    role: 'Product Marketing Manager',
    riskScore: 76,
    riskLevel: 'High',
    driver: 'Engagement score dropped 34 pts in 2 weeks',
    action: 'Trigger Engagement Follow-Up',
  },
  {
    employee: 'Tom Whitfield',
    role: 'Account Executive · Sales',
    riskScore: 69,
    riskLevel: 'High',
    driver: 'Compliance training overdue 9 days',
    action: 'Notify Hiring Manager',
  },
  {
    employee: 'Layla Haddad',
    role: 'Support Specialist · CS',
    riskScore: 58,
    riskLevel: 'Medium',
    driver: 'No manager 1:1 logged since start',
    action: 'Launch Retention Intervention',
  },
]

const levelStyles: Record<RiskLevel, string> = {
  Critical: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
  High: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  Medium: 'bg-brand-cornflower/10 text-brand-navy ring-1 ring-inset ring-brand-cornflower/30',
}

interface EmployeeRiskRadarProps {
  rows?: RiskRow[]
  title?: string
  subtitle?: string
  className?: string
  emptyMessage?: string
}

export function EmployeeRiskRadar({
  rows = DEFAULT_RISK_ROWS,
  title = 'Employee Risk Radar',
  subtitle,
  className,
  emptyMessage = 'No employees flagged — connect your data source to populate this radar.',
}: EmployeeRiskRadarProps) {
  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <Icons.risk className='h-4.5 w-4.5 text-red-500' strokeWidth={1.75} />
          {title}
        </CardTitle>
        <span className='text-micro uppercase text-brand-muted'>
          {subtitle ?? `${rows.length} flagged this week`}
        </span>
      </CardHeader>
      <CardContent className='p-0'>
        <div className='overflow-x-auto'>
          <table className='w-full min-w-[720px] border-collapse text-sm'>
            <thead>
              <tr className='border-b border-border/60 text-left text-micro uppercase tracking-wide text-brand-muted'>
                <th className='px-6 py-2.5 font-medium'>Employee</th>
                <th className='px-4 py-2.5 font-medium'>Risk Score</th>
                <th className='px-4 py-2.5 font-medium'>Risk Level</th>
                <th className='px-4 py-2.5 font-medium'>Risk Driver</th>
                <th className='px-4 py-2.5 font-medium'>Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className='px-6 py-10 text-center text-sm text-brand-muted'>
                    {emptyMessage}
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr
                  key={row.employee}
                  className='border-b border-border/40 last:border-0 hover:bg-brand-cornflower/5'
                >
                  <td className='px-6 py-3'>
                    <p className='font-medium text-brand-navy'>{row.employee}</p>
                    <p className='text-xs text-brand-muted'>{row.role}</p>
                  </td>
                  <td className='px-4 py-3 font-semibold tabular-nums text-brand-navy'>
                    {row.riskScore}
                  </td>
                  <td className='px-4 py-3'>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        levelStyles[row.riskLevel]
                      )}
                    >
                      {row.riskLevel}
                    </span>
                  </td>
                  <td className='px-4 py-3 text-brand-muted'>{row.driver}</td>
                  <td className='px-4 py-3'>
                    <button className='text-xs font-medium text-brand-cornflower underline-offset-2 hover:text-brand-navy hover:underline'>
                      {row.action} →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
