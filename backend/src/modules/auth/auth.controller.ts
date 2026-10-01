import type { CookieOptions, Request, RequestHandler } from "express";
import { env } from "../../config/env";
import { UnauthorizedError } from "../../shared/errors";
import { loginSchema } from "./auth.schemas";
import * as authService from "./auth.service";

const TOKEN_COOKIE = "token";

function jwtExpiresToMs(expiresIn: string): number {
  const match = /^(\d+)([smhd])$/i.exec(expiresIn.trim());
  if (!match) {
    return 8 * 60 * 60 * 1000;
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return value * multipliers[unit];
}

function tokenCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.COOKIE_SECURE,
    maxAge: jwtExpiresToMs(env.JWT_EXPIRES_IN),
  };
}

function getAuthenticatedUserId(req: Request): number {
  if (!req.user?.id) {
    throw new UnauthorizedError();
  }
  return req.user.id;
}

export const login: RequestHandler = async (req, res) => {
  const { username, password } = loginSchema.parse(req.body);
  const result = await authService.login(username, password);

  res.cookie(TOKEN_COOKIE, result.token, tokenCookieOptions());
  res.status(200).json({ user: result.user });
};

export const logout: RequestHandler = (_req, res) => {
  res.clearCookie(TOKEN_COOKIE, tokenCookieOptions());
  res.status(204).send();
};

export const me: RequestHandler = async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  const user = await authService.getUserById(userId);

  if (!user) {
    throw new UnauthorizedError();
  }

  res.status(200).json({ user });
};
