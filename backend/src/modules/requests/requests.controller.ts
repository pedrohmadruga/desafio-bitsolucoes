import type { Request, RequestHandler } from "express";
import { UnauthorizedError } from "../../shared/errors";
import {
  createRequestSchema,
  idParamSchema,
  listRequestsQuerySchema,
  updateRequestSchema,
} from "./requests.schemas";
import * as requestsService from "./requests.service";

function getAuthenticatedUserId(req: Request): number {
  if (!req.user?.id) {
    throw new UnauthorizedError();
  }
  return req.user.id;
}

export const create: RequestHandler = async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  const dto = createRequestSchema.parse(req.body);
  const request = await requestsService.create(userId, dto);
  res.status(201).json({ request });
};

export const list: RequestHandler = async (req, res) => {
  const filters = listRequestsQuerySchema.parse(req.query);
  const result = await requestsService.list(filters);
  res.status(200).json(result);
};

export const getById: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const request = await requestsService.getById(id);
  res.status(200).json({ request });
};

export const update: RequestHandler = async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  const { id } = idParamSchema.parse(req.params);
  const dto = updateRequestSchema.parse(req.body);
  const request = await requestsService.update(id, userId, dto);
  res.status(200).json({ request });
};

export const remove: RequestHandler = async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  const { id } = idParamSchema.parse(req.params);
  await requestsService.remove(id, userId);
  res.status(204).send();
};
