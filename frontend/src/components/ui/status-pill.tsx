import { cn } from '@/lib/utils'

export type PillTone = 'critical' | 'high' | 'medium' | 'success' | 'neutral'

const TONE_MAP: Record<PillTone, string> = {
  critical: 'bg-red-50 text-red-700 ring-red-200',
  high: 'bg-amber-50 text-amber-700 ring-amber-200',
  medium: 'bg-brand-cornflower/10 text-brand-navy ring-brand-cornflower/30',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  neutral: 'bg-muted text-brand-muted ring-border',
}

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: PillTone
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        TONE_MAP[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
