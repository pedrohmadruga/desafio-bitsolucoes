type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
}

export function Spinner({
  size = 'md',
  className = '',
  label = 'Carregando',
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={[
        'inline-block animate-spin rounded-full border-current border-r-transparent',
        sizeClasses[size],
        className,
      ].join(' ')}
    />
  )
}
