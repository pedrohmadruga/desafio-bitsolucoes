import type { RequestStatus } from '../types'

const STATUS_LABELS: Record<RequestStatus, string> = {
  ABERTO: 'Aberto',
  EM_ATENDIMENTO: 'Em Atendimento',
  CONCLUIDO: 'Concluído',
}

export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function statusLabel(status: RequestStatus): string {
  return STATUS_LABELS[status]
}
