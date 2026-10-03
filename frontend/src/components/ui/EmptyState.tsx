import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={[
        'flex w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-surface-elevated px-4 py-10 text-center',
        className,
      ].join(' ')}
    >
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description ? (
        <p className="max-w-md text-sm text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-2 w-full max-w-xs md:w-auto">{action}</div> : null}
    </div>
  )
}
