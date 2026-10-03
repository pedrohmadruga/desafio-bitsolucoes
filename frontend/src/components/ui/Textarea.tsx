import { forwardRef, type TextareaHTMLAttributes } from 'react'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, error, id, className = '', rows = 4, ...props },
    ref,
  ) {
    const textareaId = id ?? props.name

    return (
      <div className="flex w-full flex-col gap-1.5 text-left">
        <label htmlFor={textareaId} className="text-sm font-medium text-ink">
          {label}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={[
            'w-full rounded-md border bg-surface-elevated px-3 py-2 text-sm text-ink',
            'min-h-24 placeholder:text-ink-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            error ? 'border-danger' : 'border-border',
            className,
          ].join(' ')}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error && textareaId ? `${textareaId}-error` : undefined
          }
          {...props}
        />
        {error ? (
          <p
            id={textareaId ? `${textareaId}-error` : undefined}
            className="text-sm text-danger"
          >
            {error}
          </p>
        ) : null}
      </div>
    )
  },
)
