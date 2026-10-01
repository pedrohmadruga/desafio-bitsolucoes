import type { RequestHandler } from "express";
import { NotFoundError } from "../shared/errors";

export const notFound: RequestHandler = (_req, _res, next) => {
  next(new NotFoundError("Rota não encontrada"));
};
