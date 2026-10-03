import { Button } from './Button'

type PaginationProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1) return null

  const canGoPrev = page > 1
  const canGoNext = page < totalPages

  return (
    <nav
      aria-label="Paginação"
      className={[
        'flex w-full flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between',
        className,
      ].join(' ')}
    >
      <p className="text-sm text-ink-muted">
        Página {page} de {totalPages}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant="secondary"
          disabled={!canGoPrev}
          onClick={() => onPageChange(page - 1)}
          aria-label="Página anterior"
        >
          Anterior
        </Button>
        <Button
          variant="secondary"
          disabled={!canGoNext}
          onClick={() => onPageChange(page + 1)}
          aria-label="Próxima página"
        >
          Próxima
        </Button>
      </div>
    </nav>
  )
}
