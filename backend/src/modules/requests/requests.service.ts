import { RequestStatus } from "@prisma/client";
import { prisma } from "../../database/prisma";
import { NotFoundError } from "../../shared/errors";
import * as requestsRepository from "./requests.repository";
import { toRequestResponse } from "./requests.mapper";
import type { CreateRequestInput } from "./requests.schemas";

async function assertCategoryExists(categoryId: number) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!category) {
    throw new NotFoundError("Categoria não encontrada");
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
