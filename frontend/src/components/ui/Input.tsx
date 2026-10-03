import { forwardRef, type InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className = '', ...props },
  ref,
) {
  const inputId = id ?? props.name

  return (
    <div className="flex w-full flex-col gap-1.5 text-left">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={[
          'min-h-10 w-full rounded-md border bg-surface-elevated px-3 py-2 text-sm text-ink',
          'placeholder:text-ink-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          error ? 'border-danger' : 'border-border',
          className,
        ].join(' ')}
        aria-invalid={Boolean(error)}
        aria-describedby={error && inputId ? `${inputId}-error` : undefined}
        {...props}
      />
      {error ? (
        <p id={inputId ? `${inputId}-error` : undefined} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
})
