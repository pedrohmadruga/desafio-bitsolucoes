import type { ReactNode } from 'react'

type BadgeTone = 'neutral' | 'success' | 'warning' | 'info'

type BadgeProps = {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-surface text-ink-muted border-border',
  success: 'bg-status-open-bg text-status-open-fg border-transparent',
  warning: 'bg-status-progress-bg text-status-progress-fg border-transparent',
  info: 'bg-status-done-bg text-status-done-fg border-transparent',
}

export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold',
        toneClasses[tone],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
