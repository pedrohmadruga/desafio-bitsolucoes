import type { Request, RequestHandler } from "express";
import { UnauthorizedError } from "../../shared/errors";
import { createRequestSchema, idParamSchema } from "./requests.schemas";
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

export const getById: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const request = await requestsService.getById(id);
  res.status(200).json({ request });
};
