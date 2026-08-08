'use client'

import { useEffect, useState } from 'react'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { StatusPill, type PillTone } from '@/components/ui/status-pill'
import { Icons } from '@/components/ui/icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient } from '@/lib/api-client'

type ConnectionStatus = 'Healthy' | 'Degraded' | 'Not Connected' | 'Checking...'
type SystemCategory = 'System of Record' | 'Channel' | 'Orchestration' | 'Database'

interface ConnectedSystem {
  id: string
  name: string
  category: SystemCategory
  usedFor: string
  status: ConnectionStatus
  detail?: string
  live: boolean // true = backend actually checked this; false = manually asserted placeholder
}

// The Database row is asserted (this app is currently running, so it's
// trivially true). Supervity Auto and Supabase are LIVE-checked below via
// GET /api/integrations/status. Channel + a second system-of-record are
// still placeholders — wire them up the same way once you've connected them
// (see app/services/integrations.py for the pattern to copy).
const STATIC_SYSTEMS: ConnectedSystem[] = [
  {
    id: 'db',
    name: 'PostgreSQL (Backend DB)',
    category: 'Database',
    usedFor: 'Persists Supervity run history, policy evaluations, audit log, and exceptions',
    status: 'Healthy',
    live: false,
  },
  {
    id: 'channel',
    name: 'Slack / Outlook (channel)',
    category: 'Channel',
    usedFor: 'Manager nudges and at-risk-hire escalation notifications',
    status: 'Not Connected',
    live: false,
  },
]

const statusTone: Record<ConnectionStatus, PillTone> = {
  Healthy: 'success',
  Degraded: 'high',
  'Not Connected': 'neutral',
  'Checking...': 'medium',
}

const categoryTone: Record<SystemCategory, PillTone> = {
  'System of Record': 'medium',
  Channel: 'medium',
  Orchestration: 'medium',
  Database: 'medium',
}

const COLUMNS: DataTableColumn<ConnectedSystem>[] = [
  {
    key: 'name',
    header: 'System',
    render: (r) => (
      <div>
        <span className='font-medium text-brand-navy'>{r.name}</span>
        {r.live && (
          <span className='ml-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-600'>
            live-checked
          </span>
        )}
      </div>
    ),
  },
  {
    key: 'category',
    header: 'Category',
    render: (r) => <StatusPill tone={categoryTone[r.category]}>{r.category}</StatusPill>,
  },
  { key: 'usedFor', header: 'Used For', render: (r) => <span className='text-brand-muted'>{r.usedFor}</span> },
  {
    key: 'status',
    header: 'Connection Status',
    render: (r) => (
      <div>
        <StatusPill tone={statusTone[r.status]}>{r.status}</StatusPill>
        {r.detail && <p className='mt-1 max-w-xs text-xs text-brand-muted'>{r.detail}</p>}
      </div>
    ),
  },
]

interface IntegrationCheck {
  name: string
  category: string
  configured?: boolean
  connected?: boolean
  detail?: string
  workflow_name?: string
}

interface IntegrationsStatusResponse {
  supervity_auto: IntegrationCheck
  supabase: IntegrationCheck
}

export default function DataManagerPage() {
  const [liveSystems, setLiveSystems] = useState<ConnectedSystem[]>([
    {
      id: 'supervity',
      name: 'Supervity Auto (Orchestrator)',
      category: 'Orchestration',
      usedFor: 'Runs the Orchestrator and its 5+ Operator Agents for onboarding & retention',
      status: 'Checking...',
      live: true,
    },
    {
      id: 'supabase',
      name: 'Supabase',
      category: 'System of Record',
      usedFor: 'System of record your Operators read from and write to',
      status: 'Checking...',
      live: true,
    },
  ])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadStatus() {
      try {
        const data = await apiClient.get<IntegrationsStatusResponse>('/api/integrations/status')
        if (cancelled) return
        setLiveSystems([
          {
            id: 'supervity',
            name: data.supervity_auto.workflow_name
              ? `Supervity Auto — ${data.supervity_auto.workflow_name}`
              : 'Supervity Auto (Orchestrator)',
            category: 'Orchestration',
            usedFor: 'Runs the Orchestrator and its 5+ Operator Agents for onboarding & retention',
            status: data.supervity_auto.connected ? 'Healthy' : 'Not Connected',
            detail: data.supervity_auto.connected ? undefined : data.supervity_auto.detail,
            live: true,
          },
          {
            id: 'supabase',
            name: 'Supabase',
            category: 'System of Record',
            usedFor: 'System of record your Operators read from and write to',
            status: data.supabase.connected ? 'Healthy' : 'Not Connected',
            detail: data.supabase.connected ? undefined : data.supabase.detail,
            live: true,
          },
        ])
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load status')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadStatus()
    return () => {
      cancelled = true
    }
  }, [])

  const systems = [...STATIC_SYSTEMS.slice(0, 1), ...liveSystems, ...STATIC_SYSTEMS.slice(1)]
  const healthyCount = systems.filter((s) => s.status === 'Healthy').length
  const channelCount = systems.filter((s) => s.category === 'Channel').length
  const sorCount = systems.filter((s) => s.category === 'System of Record').length

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='font-display text-2xl font-bold tracking-tight text-brand-navy lg:text-3xl'>
          Data Manager
        </h1>
        <p className='mt-1 text-sm text-brand-muted'>
          Live registry of every system this operation connects to, what it&apos;s used for,
          and whether the connection is healthy.
        </p>
      </div>

      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <Card>
          <CardContent className='p-4'>
            <p className='text-xs font-medium uppercase tracking-wide text-brand-muted'>Connected</p>
            <p className='mt-2 font-display text-2xl font-bold text-brand-navy'>
              {healthyCount} / {systems.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <p className='text-xs font-medium uppercase tracking-wide text-brand-muted'>Channels</p>
            <p className='mt-2 font-display text-2xl font-bold text-brand-navy'>{channelCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <p className='text-xs font-medium uppercase tracking-wide text-brand-muted'>Systems of Record</p>
            <p className='mt-2 font-display text-2xl font-bold text-brand-navy'>{sorCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <p className='text-xs font-medium uppercase tracking-wide text-brand-muted'>Required for Gate</p>
            <p className='mt-2 font-display text-2xl font-bold text-brand-navy'>3 (2+ categories)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.database className='h-4.5 w-4.5 text-brand-cornflower' strokeWidth={1.75} />
            Connected Systems
          </CardTitle>
          <span className='text-micro uppercase text-brand-muted'>
            {loading ? 'Checking live connections…' : `${systems.length} registered`}
          </span>
        </CardHeader>
        <CardContent className='p-0'>
          <DataTable columns={COLUMNS} rows={systems} getRowId={(r) => r.id} />
        </CardContent>
      </Card>

      {error && (
        <Card className='border-red-200 bg-red-50/40'>
          <CardContent className='flex items-start gap-3 p-4'>
            <Icons.alertTriangle className='mt-0.5 h-4.5 w-4.5 shrink-0 text-red-600' strokeWidth={1.75} />
            <p className='text-sm text-brand-muted'>
              Couldn&apos;t reach the backend to check live status: {error}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className='border-amber-200 bg-amber-50/40'>
        <CardContent className='flex items-start gap-3 p-4'>
          <Icons.alertTriangle className='mt-0.5 h-4.5 w-4.5 shrink-0 text-amber-600' strokeWidth={1.75} />
          <div>
            <p className='text-sm font-medium text-brand-navy'>Two rows still need wiring</p>
            <p className='mt-0.5 text-sm text-brand-muted'>
              &quot;Channel&quot; is still a placeholder — connect whatever you&apos;re actually
              using (Slack, Outlook) and give it the same live-check treatment as Supervity
              Auto/Supabase above (see{' '}
              <code className='rounded bg-white px-1 py-0.5 text-xs'>app/services/integrations.py</code>).
              Per the guide, an entry only counts if it&apos;s visible AND healthy — a hardcoded
              row doesn&apos;t count toward the 3-integration floor.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
