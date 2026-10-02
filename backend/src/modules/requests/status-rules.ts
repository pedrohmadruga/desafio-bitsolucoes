import { RequestStatus } from "@prisma/client";

export const allowedTransitions: Record<RequestStatus, RequestStatus[]> = {
  ABERTO: [RequestStatus.EM_ATENDIMENTO],
  EM_ATENDIMENTO: [RequestStatus.ABERTO, RequestStatus.CONCLUIDO],
  CONCLUIDO: [],
};

export function canTransition(from: RequestStatus, to: RequestStatus) {
  return allowedTransitions[from].includes(to);
}
