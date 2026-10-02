import type { Prisma, RequestStatus } from "@prisma/client";
import { prisma } from "../../database/prisma";
import type { ListRequestsQuery } from "./requests.schemas";

const requestInclude = {
  category: { select: { id: true, name: true } },
  requester: { select: { id: true, name: true } },
} as const;

export type RequestWithRelations = Prisma.ServiceRequestGetPayload<{
  include: typeof requestInclude;
}>;

export type CreateRequestData = {
  title: string;
  description: string;
  categoryId: number;
  requesterId: number;
  status?: RequestStatus;
};

export type UpdateRequestData = {
  title: string;
  description: string;
  categoryId: number;
};

function buildWhere(filters: ListRequestsQuery): Prisma.ServiceRequestWhereInput {
  return {
    ...(filters.status && { status: filters.status }),
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(filters.q && {
      title: { contains: filters.q, mode: "insensitive" as const },
    }),
    ...((filters.from || filters.to) && {
      createdAt: {
        ...(filters.from && {
          gte: new Date(`${filters.from}T00:00:00.000-03:00`),
        }),
        ...(filters.to && {
          lte: new Date(`${filters.to}T23:59:59.999-03:00`),
        }),
      },
    }),
  };
}

export async function create(data: CreateRequestData) {
  return prisma.serviceRequest.create({
    data: {
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      requesterId: data.requesterId,
      status: data.status ?? "ABERTO",
    },
    include: requestInclude,
  });
}

export async function findById(id: number) {
  return prisma.serviceRequest.findUnique({
    where: { id },
    include: requestInclude,
  });
}

export async function list(filters: ListRequestsQuery) {
  const where = buildWhere(filters);
  const skip = (filters.page - 1) * filters.pageSize;

  const [items, total] = await prisma.$transaction([
    prisma.serviceRequest.findMany({
      where,
      include: requestInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: filters.pageSize,
    }),
    prisma.serviceRequest.count({ where }),
  ]);

  return { items, total };
}

export async function update(id: number, data: UpdateRequestData) {
  return prisma.serviceRequest.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
    },
    include: requestInclude,
  });
}

export async function updateStatus(id: number, status: RequestStatus) {
  return prisma.serviceRequest.update({
    where: { id },
    data: { status },
    include: requestInclude,
  });
}

export async function deleteById(id: number) {
  return prisma.serviceRequest.delete({
    where: { id },
  });
}

export async function deleteIfOpenOwned(id: number, requesterId: number) {
  const result = await prisma.serviceRequest.deleteMany({
    where: {
      id,
      requesterId,
      status: "ABERTO",
    },
  });

  return result.count;
}
