import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Spinner } from './Spinner'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  loading?: boolean
  children: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-hover disabled:bg-primary/60',
  secondary:
    'bg-surface-elevated text-ink border border-border hover:bg-surface disabled:opacity-60',
  danger:
    'bg-danger text-white hover:bg-danger-hover disabled:bg-danger/60',
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={[
        'inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors md:w-auto',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'disabled:cursor-not-allowed',
        variantClasses[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? <Spinner size="sm" className="text-current" /> : null}
      <span>{children}</span>
    </button>
  )
}
