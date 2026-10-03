import { Badge } from '../ui/Badge'
import type { RequestStatus } from '../../types'
import { statusLabel } from '../../utils/format'

type StatusBadgeProps = {
  status: RequestStatus
  className?: string
}

const statusTone = {
  ABERTO: 'success',
  EM_ATENDIMENTO: 'warning',
  CONCLUIDO: 'info',
} as const

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge tone={statusTone[status]} className={className}>
      {statusLabel(status)}
    </Badge>
  )
}
