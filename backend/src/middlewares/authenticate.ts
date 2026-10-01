import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { UnauthorizedError } from "../shared/errors";

export const authenticate: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.token as string | undefined;

  if (!token) {
    next(new UnauthorizedError());
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    const id = Number(payload.sub);

    if (!Number.isInteger(id) || id <= 0) {
      next(new UnauthorizedError());
      return;
    }

    req.user = { id };
    next();
  } catch {
    next(new UnauthorizedError());
  }
};
