'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CardWatermark } from '@/components/ui/card-watermark'
import { Icons } from '@/components/ui/icons'
import { PolicyCard, type Policy } from '@/components/ai/policies/PolicyCard'
import { PolicyDetailModal } from '@/components/ai/policies/PolicyDetailModal'
import { PolicyEditModal } from '@/components/ai/policies/PolicyEditModal'
import { CreateWithAI } from '@/components/ai/policies/CreateWithAI'
import { PermissionMatrixTab } from '@/components/ai/policies/PermissionMatrixTab'
import { StructuredBuilder } from '@/components/ai/policies/StructuredBuilder'

// ============================================================================
// Demo Data — Replace with your own API integration
// ============================================================================

const DEMO_POLICIES: Policy[] = [
  {
    id: 'mgr-policy-001',
    name: 'At-Risk Pulse Nudge Trigger',
    description: 'Auto-nudge a manager 5 days after an unacknowledged at-risk pulse, before it counts toward an accountability pattern.',
    natural_language: 'If a Peakon_Engagement response for an active hire (Day 7, Day 30, Day 60, or Day 90) has Score <= 5 OR sentiment = negative, and manager_response_days is still blank 5 calendar days after Submitted_At, send an automated nudge to the assigned manager referencing the specific hire and pulse round.',
    summary: 'First-line reminder — gives the manager a fair chance to respond before Policy 2 starts counting.',
    policy_type: 'logical',
    dsl: { conditions: [{ field: 'peakon.score', operator: 'less_than_or_equal', value: '5' }, { field: 'peakon.sentiment', operator: 'equals', value: 'negative' }, { field: 'days_since_submitted', operator: 'greater_than_or_equal', value: '5' }, { field: 'peakon.manager_response_days', operator: 'is_null', value: 'true' }], actions: [{ type: 'send_nudge', value: 'manager_email' }], match_mode: 'all' },
    refined_instruction: null,
    ai_instruction: 'WHEN (peakon.score <= 5 OR peakon.sentiment = negative) AND days_since(peakon.submitted_at) >= 5 AND peakon.manager_response_days IS NULL THEN send_nudge(manager.email, hire_id, milestone)',
    entity_name: 'peakon_engagement',
    is_active: true,
    priority: 5,
    tags: ['manager-accountability', 'nudge', 'peakon'],
    execution_count: 34,
    last_executed_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'mgr-policy-002',
    name: 'Manager Non-Responsiveness Pattern (skip-level escalation)',
    description: 'Escalate to the manager\u2019s own manager once a non-response pattern — not a single miss — is detected.',
    natural_language: 'If a single manager (by Manager_WID) has 2 or more qualifying at-risk pulses among their direct reports within a rolling 30-day window, still unacknowledged past that jurisdiction\u2019s SLA window after Submitted_At, escalate to that manager\u2019s own manager. Resolve the skip-level by looking up the non-responsive manager\u2019s own Employee_ID in Manager_Directory. Tag the Workbench item with the manager\u2019s Org and every linked hire ID as evidence.',
    summary: 'The core accountability rule — a pattern across multiple hires, not a single missed nudge, is what escalates.',
    policy_type: 'logical',
    dsl: { conditions: [{ field: 'qualifying_pulse_count_30d', operator: 'greater_than_or_equal', value: '2' }, { field: 'days_unacknowledged', operator: 'greater_than', value: 'sla_days_for_jurisdiction' }], actions: [{ type: 'resolve_skip_level', value: 'manager_directory_self_lookup' }, { type: 'escalate_to_workbench', value: 'skip_level_manager' }], match_mode: 'all' },
    refined_instruction: null,
    ai_instruction: 'WHEN count(qualifying_pulses WHERE manager_wid = X, window=30d) >= 2 AND days_unacknowledged > sla_days_for_jurisdiction(X) THEN skip_level = lookup(Manager_Directory, Employee_ID = X.manager_wid).Manager_WID; escalate_to_workbench(skip_level)',
    entity_name: 'manager',
    is_active: true,
    priority: 18,
    tags: ['manager-accountability', 'escalation', 'peakon', 'manager_directory'],
    execution_count: 9,
    last_executed_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 16 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'mgr-policy-003',
    name: 'False-Positive Suppression',
    description: 'A healthy score never counts toward the accountability pattern, regardless of comment wording — precision over recall.',
    natural_language: 'A pulse response never counts toward Policy 2 (Manager Non-Responsiveness Pattern) if Score >= 6 AND sentiment != negative, even if the Comment text contains cautionary-sounding words. Additionally, exclude any response where x_confidential = true from Policy 2\u2019s count entirely \u2014 confidential disclosures are handled only by Policy 4 and must never appear in a manager-accountability tally.',
    summary: 'Directly targets the dataset\u2019s seeded false-positive trap: benign comment + healthy score must not escalate.',
    policy_type: 'logical',
    dsl: { conditions: [{ field: 'peakon.score', operator: 'greater_than_or_equal', value: '6' }, { field: 'peakon.sentiment', operator: 'not_equals', value: 'negative' }], actions: [{ type: 'exclude_from_count', value: 'mgr-policy-002' }], match_mode: 'all' },
    refined_instruction: null,
    ai_instruction: 'WHEN peakon.score >= 6 AND peakon.sentiment != negative THEN exclude_from(mgr-policy-002.count) — ALSO WHEN peakon.x_confidential = true THEN exclude_from(mgr-policy-002.count)',
    entity_name: 'peakon_engagement',
    is_active: true,
    priority: 19,
    tags: ['manager-accountability', 'precision', 'peakon'],
    execution_count: 22,
    last_executed_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 16 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 'mgr-policy-004',
    name: 'Confidential Disclosure Hard-Route',
    description: 'Sensitive disclosures never appear on any dashboard, insight, or tally \u2014 only in the restricted Workbench queue.',
    natural_language: 'If Peakon_Engagement.x_confidential = true for any response, suppress it completely from the Dashboard, AI Insights, and the Manager Accountability tally. Route it exclusively to the Workbench\u2019s confidential queue, visible only to the People Ops Lead role, with the Comment field hidden behind an explicit reveal action \u2014 never shown inline in any list view.',
    summary: 'Keeps sensitive disclosures out of every surface except the restricted confidential queue.',
    policy_type: 'natural_language',
    dsl: null,
    refined_instruction: 'On peakon_engagement.x_confidential = true: suppress from dashboard, insights, and manager-accountability tally (mgr-policy-002); route only to confidential Workbench queue restricted to People Ops Lead; hide Comment behind explicit reveal.',
    ai_instruction: 'On peakon_engagement.x_confidential = true: suppress from dashboard, insights, and manager-accountability tally (mgr-policy-002); route only to confidential Workbench queue restricted to People Ops Lead; hide Comment behind explicit reveal.',
    entity_name: 'peakon_engagement',
    is_active: true,
    priority: 25,
    tags: ['confidentiality', 'manager-accountability', 'peakon'],
    execution_count: 3,
    last_executed_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 16 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: 'mgr-policy-005',
    name: 'Jurisdiction-Scaled Accountability SLA',
    description: 'The non-response window in Policy 2 changes by legal entity, not a single global number.',
    natural_language: 'The SLA window used by Policy 2 scales by the hire\u2019s Locations_Entities jurisdiction: Company Malaysia Sdn Bhd and Company Penang Operations Sdn Bhd (MY) use 10 days. Company Singapore Pte Ltd and Company Australia Pty Ltd (SG/AU) use 7 days, reflecting stricter probation-period check-in norms. Company India Pvt Ltd and Company Philippines Inc use 14 days, to account for an additional HR business-partner triage layer before an issue reaches the direct manager.',
    summary: 'Change one entity\u2019s number here and only that jurisdiction\u2019s escalation timing shifts on the next run \u2014 live, no code.',
    policy_type: 'logical',
    dsl: {
      conditions: [{ field: 'hire.jurisdiction', operator: 'in', value: 'MY,SG,IN,PH,AU' }],
      actions: [
        { type: 'set_sla_days', value: 'MY=10, PENANG=10, SG=7, AU=7, IN=14, PH=14' },
      ],
      match_mode: 'all',
    },
    refined_instruction: null,
    ai_instruction: 'sla_days_for_jurisdiction(entity) = { MY: 10, Penang-MY: 10, SG: 7, AU: 7, IN: 14, PH: 14 }[entity.jurisdiction]',
    entity_name: 'locations_entities',
    is_active: true,
    priority: 17,
    tags: ['manager-accountability', 'jurisdiction', 'sla'],
    execution_count: 9,
    last_executed_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 16 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
]

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

// ============================================================================
// Types
// ============================================================================

type TabType = 'policies' | 'create-ai' | 'structured' | 'matrix'
type FilterType = 'all' | 'active' | 'inactive' | 'logical' | 'natural_language'
type SortType = 'newest' | 'oldest' | 'priority' | 'name' | 'executions'

// ============================================================================
// Tab Configuration
// ============================================================================

const TABS = [
  { id: 'policies' as TabType, label: 'Policies', Icon: Icons.layers },
  { id: 'create-ai' as TabType, label: 'Create with AI', Icon: Icons.sparkles },
  { id: 'structured' as TabType, label: 'Structured Builder', Icon: Icons.grid },
  { id: 'matrix' as TabType, label: 'Permission Matrix', Icon: Icons.table },
]

// ============================================================================
// Page Component
// ============================================================================

export default function AIPoliciesPage() {
  // State
  const [policies, setPolicies] = useState<Policy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('policies')
  
  // Modal state
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  // Filters
  const [filter, setFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortType>('newest')
  const [searchQuery, setSearchQuery] = useState('')

  // Structured builder state
  const [structuredDSL, setStructuredDSL] = useState<{conditions: Array<{field: string; operator: string; value: string}>; actions: Array<{type: string; value?: string}>; match_mode: 'all' | 'any'} | null>(null)
  const [structuredName, setStructuredName] = useState('')
  const [isSavingStructured, setIsSavingStructured] = useState(false)

  // ============================================================================
  // Data — Loaded from demo data (replace with API fetch)
  // ============================================================================

  const loadPolicies = useCallback(() => {
    setIsLoading(true)
    // Simulate loading — replace with real API call
    setTimeout(() => {
      setPolicies(DEMO_POLICIES)
      setIsLoading(false)
    }, 300)
  }, [])

  useEffect(() => {
    loadPolicies()
  }, [loadPolicies])

  // ============================================================================
  // Policy Actions
  // ============================================================================

  const handleCardClick = useCallback((policy: Policy) => {
    setSelectedPolicy(policy)
    setIsDetailModalOpen(true)
  }, [])

  const handleEditFromDetail = useCallback((policy: Policy) => {
    setEditingPolicy(policy)
    setIsEditModalOpen(true)
  }, [])

  const handleSavePolicy = useCallback(async () => {
    loadPolicies()
  }, [loadPolicies])

  const togglePolicyStatus = useCallback(async (id: string, _isActive: boolean) => {
    // Toggle locally (replace with API call)
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p))
  }, [])

  const deletePolicy = useCallback(async (id: string) => {
    // Delete locally (replace with API call)
    setPolicies(prev => prev.filter(p => p.id !== id))
  }, [])

  const handlePolicyCreate = async (policyData: {
    name: string
    description: string
    naturalLanguage: string
    policyType: 'logical' | 'natural_language'
    dsl: unknown
    refinedInstruction: string | null
    entityName: string | null
    tags: string[]
    priority: number
  }) => {
    // Add locally (replace with API call)
    const newPolicy: Policy = {
      id: `user-${Date.now()}`,
      name: policyData.name,
      description: policyData.description,
      natural_language: policyData.naturalLanguage,
      summary: policyData.description,
      policy_type: policyData.policyType,
      dsl: policyData.dsl as Policy['dsl'],
      refined_instruction: policyData.refinedInstruction,
      ai_instruction: policyData.naturalLanguage,
      entity_name: policyData.entityName,
      is_active: true,
      priority: policyData.priority,
      tags: policyData.tags,
      execution_count: 0,
      last_executed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setPolicies(prev => [newPolicy, ...prev])
    setActiveTab('policies')
  }

  // ============================================================================
  // Filtering & Sorting
  // ============================================================================

  const filteredPolicies = policies
    .filter((policy) => {
      if (filter === 'active' && !policy.is_active) return false
      if (filter === 'inactive' && policy.is_active) return false
      if (filter === 'logical' && policy.policy_type !== 'logical') return false
      if (filter === 'natural_language' && policy.policy_type !== 'natural_language') return false

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          policy.name.toLowerCase().includes(query) ||
          policy.description.toLowerCase().includes(query) ||
          policy.natural_language.toLowerCase().includes(query) ||
          policy.tags.some((tag) => tag.toLowerCase().includes(query))
        )
      }

      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'priority':
          return a.priority - b.priority
        case 'name':
          return a.name.localeCompare(b.name)
        case 'executions':
          return b.execution_count - a.execution_count
        default:
          return 0
      }
    })

  // ============================================================================
  // Stats
  // ============================================================================

  const stats = {
    total: policies.length,
    active: policies.filter((p) => p.is_active).length,
    structured: policies.filter((p) => p.policy_type === 'logical').length,
    natural: policies.filter((p) => p.policy_type === 'natural_language').length,
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display-3 font-bold tracking-tight text-brand-navy lg:text-display-2">
            AI Policies
          </h1>
          <p className="mt-1 text-lg text-muted-foreground">
            Define business rules in natural language. The AI determines the best format.
          </p>
        </div>
        <Button
          variant="gradient"
          onClick={() => setActiveTab('create-ai')}
          className={activeTab !== 'policies' ? 'opacity-50' : ''}
        >
          <Icons.plus className="mr-2 h-4 w-4" />
          Create Policy
        </Button>
      </motion.div>

      {/* Tabs - AT THE TOP */}
      <motion.div variants={itemVariants}>
        <div className="flex gap-1 p-1.5 bg-gray-100 rounded-xl">
          {TABS.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'text-brand-navy'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              whileHover={{ scale: activeTab === tab.id ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-lg shadow-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <tab.Icon className="h-4 w-4" />
                {tab.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content - Use initial={false} on first render to avoid blank state */}
      <AnimatePresence mode="popLayout">
        {activeTab === 'policies' && (
          <motion.div
            key="policies-tab"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
          {/* Stats Bar - No initial animation to prevent blank flash */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: stats.total, label: 'Total Policies', icon: Icons.layers, bg: 'bg-brand-navy/10', color: 'text-brand-navy' },
              { value: stats.active, label: 'Active', icon: Icons.check, bg: 'bg-emerald-100', color: 'text-emerald-600' },
              { value: stats.structured, label: 'Structured', icon: Icons.grid, bg: 'bg-blue-100', color: 'text-blue-600' },
              { value: stats.natural, label: 'Natural Language', icon: Icons.brain, bg: 'bg-purple-100', color: 'text-purple-600' },
            ].map((stat) => (
              <motion.div 
                key={stat.label}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-default"
                whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              >
                <div className="flex items-center gap-3">
                  <motion.div 
                    className={cn('p-2 rounded-lg', stat.bg)}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <stat.icon className={cn('h-5 w-5', stat.color)} />
                  </motion.div>
                  <div>
                    <p className={cn('text-2xl font-bold', stat.color)}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Filters & Search */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search policies..."
                className={cn(
                  'w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-white',
                  'text-sm focus:outline-none focus:ring-2 focus:ring-brand-cornflower/50'
                )}
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Filter:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="px-3 py-2.5 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-cornflower/50"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="logical">Structured</option>
                <option value="natural_language">Natural Language</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="px-3 py-2.5 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-cornflower/50"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="priority">Priority</option>
                <option value="name">Name</option>
                <option value="executions">Most Used</option>
              </select>
            </div>
          </motion.div>

          {/* Policy Grid */}
          <motion.div variants={itemVariants}>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Icons.loader className="h-8 w-8 animate-spin text-brand-cornflower" />
              </div>
            ) : filteredPolicies.length === 0 ? (
              <Card className="relative overflow-hidden">
                <CardWatermark opacity={3} scale={1} />
                <CardContent className="relative z-10 flex flex-col items-center justify-center py-16 text-center">
                  <div className={cn(
                    'mb-4 flex h-16 w-16 items-center justify-center rounded-2xl',
                    'bg-gradient-to-br from-brand-cornflower/20 to-brand-purple/20'
                  )}>
                    <Icons.brain className="h-8 w-8 text-brand-cornflower" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-brand-navy">
                    {searchQuery || filter !== 'all' ? 'No matching policies' : 'No policies yet'}
                  </h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    {searchQuery || filter !== 'all'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Create your first AI policy using natural language.'}
                  </p>
                  <Button
                    variant="gradient"
                    className="mt-6"
                    onClick={() => setActiveTab('create-ai')}
                  >
                    <Icons.sparkles className="mr-2 h-4 w-4" />
                    Create with AI
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPolicies.map((policy) => (
                  <PolicyCard
                    key={policy.id}
                    policy={policy}
                    onClick={handleCardClick}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {activeTab === 'create-ai' && (
        <motion.div
          key="create-ai-tab"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.15 }}
        >
          <Card className="relative overflow-hidden">
            <CardWatermark opacity={2} scale={1} />
            <CardContent className="relative z-10 py-8">
              <CreateWithAI
                onPolicyCreate={handlePolicyCreate}
                onCancel={() => setActiveTab('policies')}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeTab === 'structured' && (
        <motion.div
          key="structured-tab"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.15 }}
        >
          <Card className="relative overflow-hidden">
            <CardWatermark opacity={2} scale={1} />
            <CardContent className="relative z-10 py-8">
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-brand-navy mb-2">
                    Structured Rule Builder
                  </h2>
                  <p className="text-muted-foreground">
                    Visually build rules with conditions and actions
                  </p>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Rule Name *</label>
                  <input
                    type="text"
                    value={structuredName}
                    onChange={(e) => setStructuredName(e.target.value)}
                    placeholder="e.g., Auto-Approve Low Value Items"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-brand-cornflower/50"
                  />
                </div>
                <StructuredBuilder
                  onChange={(dsl) => setStructuredDSL(dsl)}
                />
                <div className="flex justify-center gap-3 mt-8">
                  <Button variant="ghost" onClick={() => setActiveTab('policies')}>
                    Cancel
                  </Button>
                  <Button
                    variant="gradient"
                    disabled={!structuredDSL || structuredDSL.conditions.length === 0 || !structuredName.trim() || isSavingStructured}
                    onClick={async () => {
                      if (!structuredDSL || !structuredName.trim()) return
                      setIsSavingStructured(true)
                      try {
                        await handlePolicyCreate({
                          name: structuredName.trim(),
                          description: '',
                          naturalLanguage: `Structured rule: ${structuredName}`,
                          policyType: 'logical',
                          dsl: {
                            conditions: structuredDSL.conditions.map(c => ({ field: c.field, operator: c.operator, value: c.value })),
                            actions: structuredDSL.actions.map(a => ({ type: a.type, value: a.value })),
                            match_mode: structuredDSL.match_mode,
                          },
                          refinedInstruction: null,
                          entityName: null,
                          tags: ['structured'],
                          priority: 50,
                        })
                        setStructuredName('')
                        setStructuredDSL(null)
                      } finally {
                        setIsSavingStructured(false)
                      }
                    }}
                  >
                    {isSavingStructured ? (
                      <><Icons.loader className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                    ) : (
                      <><Icons.check className="mr-2 h-4 w-4" />Save Policy</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeTab === 'matrix' && (
        <motion.div
          key="matrix-tab"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.15 }}
        >
          <PermissionMatrixTab />
        </motion.div>
      )}
      </AnimatePresence>

      {/* Detail Modal - View only */}
      <PolicyDetailModal
        policy={selectedPolicy}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedPolicy(null)
        }}
        onEdit={handleEditFromDetail}
        onToggleStatus={(id, isActive) => {
          togglePolicyStatus(id, isActive)
          setIsDetailModalOpen(false)
        }}
        onDelete={(id) => {
          deletePolicy(id)
          setIsDetailModalOpen(false)
        }}
      />

      {/* Edit Modal */}
      <PolicyEditModal
        policy={editingPolicy}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingPolicy(null)
        }}
        onSave={handleSavePolicy}
      />
    </motion.div>
  )
}
