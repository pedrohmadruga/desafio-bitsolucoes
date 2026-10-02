import { RequestStatus } from "@prisma/client";
import { prisma } from "../../database/prisma";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../shared/errors";
import type { RequestWithRelations } from "./requests.repository";
import * as requestsRepository from "./requests.repository";
import { toRequestResponse } from "./requests.mapper";
import type {
  CreateRequestInput,
  ListRequestsQuery,
  UpdateRequestInput,
} from "./requests.schemas";

async function assertCategoryExists(categoryId: number) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!category) {
    throw new NotFoundError("Categoria não encontrada");
  }
}

function assertOwnerCanMutateOpen(
  request: RequestWithRelations,
  userId: number,
) {
  if (request.requesterId !== userId) {
    throw new ForbiddenError(
      "Você só pode alterar solicitações das quais é o solicitante",
    );
  }

  if (request.status !== RequestStatus.ABERTO) {
    throw new ConflictError(
      "Só é possível alterar solicitações com status Aberto",
      "REQUEST_NOT_OPEN",
    );
  }
}

export async function create(userId: number, dto: CreateRequestInput) {
  await assertCategoryExists(dto.categoryId);

  const request = await requestsRepository.create({
    title: dto.title,
    description: dto.description,
    categoryId: dto.categoryId,
    requesterId: userId,
    status: RequestStatus.ABERTO,
  });

  return toRequestResponse(request);
}

export async function getById(id: number) {
  const request = await requestsRepository.findById(id);

  if (!request) {
    throw new NotFoundError("Solicitação não encontrada");
  }

  return toRequestResponse(request);
}

export async function list(filters: ListRequestsQuery) {
  const { items, total } = await requestsRepository.list(filters);
  const totalPages = total === 0 ? 0 : Math.ceil(total / filters.pageSize);

  return {
    data: items.map(toRequestResponse),
    meta: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages,
    },
  };
}

export async function update(
  id: number,
  userId: number,
  dto: UpdateRequestInput,
) {
  const existing = await requestsRepository.findById(id);

  if (!existing) {
    throw new NotFoundError("Solicitação não encontrada");
  }

  assertOwnerCanMutateOpen(existing, userId);
  await assertCategoryExists(dto.categoryId);

  const updated = await requestsRepository.update(id, {
    title: dto.title,
    description: dto.description,
    categoryId: dto.categoryId,
  });

  return toRequestResponse(updated);
}

export async function remove(id: number, userId: number) {
  // deleteMany atômico reduz a janela de corrida entre checagem e exclusão
  const deleted = await requestsRepository.deleteIfOpenOwned(id, userId);

  if (deleted === 1) {
    return;
  }

  const existing = await requestsRepository.findById(id);

  if (!existing) {
    throw new NotFoundError("Solicitação não encontrada");
  }

  if (existing.requesterId !== userId) {
    throw new ForbiddenError(
      "Você só pode excluir solicitações das quais é o solicitante",
    );
  }

  throw new ConflictError(
    "Só é possível excluir solicitações com status Aberto",
    "REQUEST_NOT_OPEN",
  );
}
