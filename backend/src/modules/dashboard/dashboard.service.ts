import { prisma } from "../../database/prisma";

export async function getStats() {
  const grouped = await prisma.serviceRequest.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const counts = {
    ABERTO: 0,
    EM_ATENDIMENTO: 0,
    CONCLUIDO: 0,
  };

  for (const row of grouped) {
    counts[row.status] = row._count._all;
  }

  const total = counts.ABERTO + counts.EM_ATENDIMENTO + counts.CONCLUIDO;

  return {
    total,
    aberto: counts.ABERTO,
    emAtendimento: counts.EM_ATENDIMENTO,
    concluido: counts.CONCLUIDO,
  };
}
