import { forwardRef, type ReactNode, type SelectHTMLAttributes } from 'react'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  error?: string
  children: ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, id, className = '', children, ...props },
  ref,
) {
  const selectId = id ?? props.name

  return (
    <div className="flex w-full flex-col gap-1.5 text-left">
      <label htmlFor={selectId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <select
        ref={ref}
        id={selectId}
        className={[
          'min-h-10 w-full rounded-md border bg-surface-elevated px-3 py-2 text-sm text-ink',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          error ? 'border-danger' : 'border-border',
          className,
        ].join(' ')}
        aria-invalid={Boolean(error)}
        aria-describedby={error && selectId ? `${selectId}-error` : undefined}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p
          id={selectId ? `${selectId}-error` : undefined}
          className="text-sm text-danger"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
})
