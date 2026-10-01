import { prisma } from "../../database/prisma";

export async function findAll() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
    },
  });
}
