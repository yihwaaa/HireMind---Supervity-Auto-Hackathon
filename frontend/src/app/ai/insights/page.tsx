'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CardWatermark } from '@/components/ui/card-watermark'
import { Icons } from '@/components/ui/icons'
import { InsightCard, type Insight } from '@/components/ai/insights/InsightCard'
import { PatternCluster, type Pattern } from '@/components/ai/insights/PatternCluster'
import { ActionCard, type ActionItem } from '@/components/ai/insights/ActionCard'

// ============================================================================
// Demo Data — Replace with your own API integration
// ============================================================================

const DEMO_INSIGHTS: Insight[] = [
  {
    id: 'demo-insight-001',
    type: 'pattern',
    severity: 'high',
    title: 'Attrition-Risk Cluster in Sales Cohort',
    description: '4 of 11 new hires who started in the last 3 weeks on the Sales team show a combined risk score above 65, driven mostly by engagement drop rather than task completion.',
    data: { cohort: 'Sales · Jul 21 - Aug 4, 2026', at_risk_count: 4, cohort_size: 11, dominant_driver: 'engagement_drop' },
    suggested_action: 'Open a Retention Intelligence review for the Sales Jul-Aug cohort before day 30',
    action_type: 'open_retention_review',
    confidence: 0.87,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    is_demo: true,
  },
  {
    id: 'demo-insight-002',
    type: 'anomaly',
    severity: 'critical',
    title: 'Provisioning Bottleneck: IT Security',
    description: 'IT Security is the blocking team on 6 of the 8 open cross-team dependencies this week, with an average wait of 9.2 days versus a 2.1-day average for other teams.',
    data: { blocking_team: 'IT Security', open_dependencies: 6, avg_wait_days: 9.2, other_teams_avg_days: 2.1 },
    suggested_action: 'Escalate the IT Security provisioning queue to the Cross-Team Dependency Watch',
    action_type: 'escalate_dependency',
    confidence: 0.94,
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    is_demo: true,
  },
  {
    id: 'demo-insight-003',
    type: 'recommendation',
    severity: 'high',
    title: 'Manager Non-Responsiveness Pattern: Kevin Goh (Sales)',
    description: '3 direct reports of Kevin Goh (Sales, Company Malaysia Sdn Bhd) have at-risk Peakon pulses unacknowledged past the 10-day MY jurisdiction SLA — Nurul Hassan (Day 30, score 3, 14d), Wei Ling Tan (Day 7, score 4, 9d), Arjun Selvam (Day 60, score 5, 7d). This crosses the 2-in-30-days threshold in Manager Non-Responsiveness Pattern (Policy 2).',
    data: { manager: 'Kevin Goh', manager_wid: '006140bc-6dbd-2df9-29ec-9b1114eca3ab', org: 'Sales', qualifying_pulse_count: 3, window_days: 30, jurisdiction: 'MY', sla_days: 10, policy_triggered: 'Manager Non-Responsiveness Pattern (skip-level escalation)' },
    suggested_action: 'Open Manager Accountability — escalate to Kevin Goh\u2019s resolved skip-level (Priya Ramasamy) via Manager_Directory self-lookup',
    action_type: 'open_manager_accountability',
    confidence: 0.93,
    created_at: new Date(Date.now() - 9 * 3600000).toISOString(),
    is_demo: true,
  },
  {
    id: 'demo-insight-006',
    type: 'pattern',
    severity: 'low',
    title: 'False-Positive Correctly Suppressed',
    description: 'A Day 7 pulse scored 8 with the comment "Slight paperwork delay but manager sorted it fast" was NOT counted toward any manager\u2019s accountability pattern — score >= 6 and sentiment is positive, so False-Positive Suppression (Policy 3) excluded it despite the cautionary-sounding words in the comment.',
    data: { score: 8, sentiment: 'positive', policy_triggered: 'False-Positive Suppression', excluded: true },
    suggested_action: 'No action needed — shown to demonstrate policy precision, not a real exception',
    action_type: 'none',
    confidence: 1,
    created_at: new Date(Date.now() - 11 * 3600000).toISOString(),
    is_demo: true,
  },
  {
    id: 'demo-insight-004',
    type: 'anomaly',
    severity: 'critical',
    title: 'First-Payroll Variance Detected',
    description: 'Amara Chen\u2019s first pay cycle differs from her offer letter compensation by 4.1%, above the 2% freeze threshold. Payroll auto-approval has been frozen pending finance sign-off.',
    data: { employee: 'Amara Chen', variance_pct: 4.1, threshold_pct: 2, policy_triggered: 'First-Payroll Verification Freeze' },
    suggested_action: 'Review in the Workbench — routed to Finance for sign-off',
    action_type: 'review_workbench',
    confidence: 0.99,
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
    is_demo: true,
  },
  {
    id: 'demo-insight-005',
    type: 'alert',
    severity: 'critical',
    title: 'Sensitive Disclosure — Confidential Path Only',
    description: 'A pulse survey comment was classified as a sensitive personal disclosure and hard-routed to the confidential Workbench queue. No further detail is surfaced here per the Confidential Disclosure Routing policy.',
    data: { routing: 'confidential_queue_only', visible_to: 'People Ops Lead' },
    suggested_action: 'Open the confidential queue in the Workbench',
    action_type: 'open_confidential_queue',
    confidence: 1,
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    is_demo: true,
  },
]

const DEMO_PATTERNS: Pattern[] = [
  { name: 'Peak Business Hours', frequency: 'daily', confidence: 0.92, sample_size: 2500, description: 'Activity peaks between 9-11 AM and 2-4 PM on weekdays', is_demo: true },
  { name: 'Weekend Activity Drop', frequency: 'weekly', confidence: 0.96, sample_size: 8400, description: 'Weekend activity drops to 12% of weekday average', is_demo: true },
  { name: 'Month-End Surge', frequency: 'monthly', confidence: 0.89, sample_size: 15000, description: 'Last 3 days of month show 45% higher transaction volume', is_demo: true },
  { name: 'Vendor Preference Clustering', frequency: 'ongoing', confidence: 0.78, sample_size: 1200, description: 'Top 5 vendors account for 67% of all transactions', is_demo: true },
]

const DEMO_ACTIONS: ActionItem[] = [
  { title: 'Create policy for sub-$50 auto-approval', priority: 'high', estimated_impact: 'Save 3.5 hours/week', action_type: 'create_policy', action_config: { template: 'auto_approve', threshold: 50 }, is_demo: true },
  { title: 'Investigate 3 AM API spike', priority: 'high', estimated_impact: 'Security improvement', action_type: 'investigate', action_config: { log_type: 'api_access', time_range: '02:00-04:00' }, is_demo: true },
  { title: 'Review duplicate transaction pair', priority: 'critical', estimated_impact: 'Prevent $4,750 overpayment', action_type: 'review_transaction', action_config: { transaction_ids: ['TXN-2024-001234', 'TXN-2024-001235'] }, is_demo: true },
]

interface _InsightsResponse {
  insights: Insight[]
  patterns: Pattern[]
  actions: ActionItem[]
}

// Tab configuration
interface Tab {
  id: string
  label: string
  icon: React.ElementType
}

const tabs: Tab[] = [
  { id: 'summary', label: 'Summary', icon: Icons.activity },
  { id: 'patterns', label: 'Patterns', icon: Icons.layers },
  { id: 'actions', label: 'Actions', icon: Icons.zap },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function AIInsightsPage() {
  const [activeTab, setActiveTab] = useState('summary')
  const [insights, setInsights] = useState<Insight[]>([])
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [actions, setActions] = useState<ActionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const router = useRouter()

  const fetchInsights = useCallback(async () => {
    setIsLoading(true)
    // Simulate loading — replace with real API call
    setTimeout(() => {
      setInsights(DEMO_INSIGHTS)
      setPatterns(DEMO_PATTERNS)
      setActions(DEMO_ACTIONS)
      setIsLoading(false)
    }, 300)
  }, [])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    // Simulate analysis — replace with real API call
    setTimeout(() => {
      setInsights(DEMO_INSIGHTS)
      setPatterns(DEMO_PATTERNS)
      setActions(DEMO_ACTIONS)
      setIsAnalyzing(false)
    }, 1500)
  }

  const handleInsightAction = useCallback(async (insight: Insight) => {
    // Route based on action_type
    switch (insight.action_type) {
      case 'create_policy':
        router.push('/ai/policies?tab=create-with-ai')
        break
      case 'investigate':
      case 'review_duplicate':
        router.push('/workbench')
        break
      default:
        break
    }
  }, [router])

  const handleDismissInsight = useCallback(async (id: string) => {
    // Optimistic UI update
    setInsights(prev => prev.filter(i => i.id !== id))
  }, [])

  const handleApplyAction = useCallback(async (action: ActionItem) => {
    // Route based on action type
    switch (action.action_type) {
      case 'create_policy':
        router.push('/ai/policies?tab=create-with-ai')
        break
      case 'investigate':
      case 'review_transaction':
        router.push('/workbench')
        break
      default:
        break
    }
  }, [router])

  // Stats for summary
  const criticalCount = insights.filter(i => i.severity === 'critical').length
  const warningCount = insights.filter(i => i.severity === 'warning').length
  const infoCount = insights.filter(i => i.severity === 'info').length

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-display-3 font-bold tracking-tight text-brand-navy lg:text-display-2">
            AI Insights
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            AI-powered analysis of your data. Discover patterns, anomalies, and optimization opportunities.
          </p>
        </div>
        <Button
          variant="gradient"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Icons.loader className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Icons.sparkles className="mr-2 h-4 w-4" strokeWidth={1.5} />
              Run Analysis
            </>
          )}
        </Button>
      </motion.div>

      {/* Demo Data Notice */}
      <motion.div 
        variants={itemVariants}
        className="rounded-lg border border-amber-200 bg-amber-50 p-4"
      >
        <div className="flex items-start gap-3">
          <Icons.info className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-amber-900">Demo Insights</p>
            <p className="text-sm text-amber-700 mt-1">
              Items marked with [DEMO] are sample data for demonstration purposes. 
              Connect your AI backend to enable real-time analysis of your data.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-3">
        <Card className="relative overflow-hidden">
          <CardWatermark opacity={2} scale={0.8} />
          <CardContent className="relative z-10 flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
              <Icons.alertCircle className="h-6 w-6 text-red-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-navy">{criticalCount}</p>
              <p className="text-sm text-muted-foreground">Critical Issues</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardWatermark opacity={2} scale={0.8} />
          <CardContent className="relative z-10 flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <Icons.alertTriangle className="h-6 w-6 text-amber-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-navy">{warningCount}</p>
              <p className="text-sm text-muted-foreground">Warnings</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardWatermark opacity={2} scale={0.8} />
          <CardContent className="relative z-10 flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <Icons.lightbulb className="h-6 w-6 text-blue-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-navy">{infoCount + patterns.length}</p>
              <p className="text-sm text-muted-foreground">Recommendations</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div variants={itemVariants}>
        <div className={cn(
          'inline-flex items-center gap-1 rounded-xl p-1',
          'bg-white/50 border border-border/50',
          'backdrop-blur-sm'
        )}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex items-center gap-2 rounded-lg px-4 py-2.5',
                  'text-sm font-medium transition-all duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cornflower/50',
                  isActive
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeInsightTab"
                    className="absolute inset-0 rounded-lg bg-brand-navy shadow-soft"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Icons.loader className="h-8 w-8 animate-spin text-brand-cornflower" />
            </div>
          ) : (
            <>
              {activeTab === 'summary' && (
                <Card className="relative overflow-hidden">
                  <CardWatermark opacity={2} scale={1} />
                  <CardHeader className="relative z-10">
                    <CardTitle>All Insights</CardTitle>
                    <CardDescription>
                      {insights.length} insights generated from your data analysis.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10 space-y-4">
                    {insights.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className={cn(
                          'mb-4 flex h-16 w-16 items-center justify-center rounded-2xl',
                          'bg-gradient-to-br from-brand-cornflower/20 to-brand-purple/20'
                        )}>
                          <Icons.lightbulb className="h-8 w-8 text-brand-cornflower" strokeWidth={1.5} />
                        </div>
                        <h3 className="font-display text-lg font-semibold text-brand-navy">
                          No insights yet
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                          Run an analysis to discover patterns, anomalies, and recommendations.
                        </p>
                        <Button
                          variant="gradient"
                          className="mt-6"
                          onClick={handleAnalyze}
                          disabled={isAnalyzing}
                        >
                          <Icons.sparkles className="mr-2 h-4 w-4" strokeWidth={1.5} />
                          Generate Insights
                        </Button>
                      </div>
                    ) : (
                      insights.map((insight) => (
                        <InsightCard
                          key={insight.id}
                          insight={insight}
                          onAction={handleInsightAction}
                          onDismiss={handleDismissInsight}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === 'patterns' && (
                <Card className="relative overflow-hidden">
                  <CardWatermark opacity={2} scale={1} />
                  <CardHeader className="relative z-10">
                    <CardTitle>Detected Patterns</CardTitle>
                    <CardDescription>
                      Recurring behaviors and trends identified in your data.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <PatternCluster patterns={patterns} />
                  </CardContent>
                </Card>
              )}

              {activeTab === 'actions' && (
                <Card className="relative overflow-hidden">
                  <CardWatermark opacity={2} scale={1} />
                  <CardHeader className="relative z-10">
                    <CardTitle>Recommended Actions</CardTitle>
                    <CardDescription>
                      AI-suggested improvements based on your insights.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10 space-y-3">
                    {actions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className={cn(
                          'mb-4 flex h-12 w-12 items-center justify-center rounded-xl',
                          'bg-muted/50'
                        )}>
                          <Icons.zap className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          No actions recommended at this time.
                        </p>
                      </div>
                    ) : (
                      actions.map((action, idx) => (
                        <ActionCard
                          key={idx}
                          action={action}
                          onApply={handleApplyAction}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

