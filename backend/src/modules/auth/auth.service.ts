import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { prisma } from "../../database/prisma";
import { UnauthorizedError } from "../../shared/errors";

const INVALID_CREDENTIALS = "Usuário ou senha inválidos";

function toPublicUser(user: { id: number; name: string; username: string }) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
  };
}

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    throw new UnauthorizedError(INVALID_CREDENTIALS, "INVALID_CREDENTIALS");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new UnauthorizedError(INVALID_CREDENTIALS, "INVALID_CREDENTIALS");
  }

  const token = jwt.sign({ sub: user.id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

  return {
    token,
    user: toPublicUser(user),
  };
}

export async function getUserById(id: number) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      username: true,
    },
  });

  return user;
}
