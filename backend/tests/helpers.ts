import bcrypt from "bcryptjs";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/database/prisma";

type CreateUserInput = {
  username: string;
  password: string;
  name?: string;
};

export async function createUser({
  username,
  password,
  name = "Usuário Teste",
}: CreateUserInput) {
  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      username,
      passwordHash,
      name,
    },
  });
}

export async function createCategory(name: string) {
  return prisma.category.create({
    data: { name },
  });
}

export async function loginAs(user: { username: string; password: string }) {
  const agent = request.agent(app);

  const res = await agent.post("/api/auth/login").send({
    username: user.username,
    password: user.password,
  });

  if (res.status !== 200) {
    throw new Error(`Falha ao autenticar ${user.username}: status ${res.status}`);
  }

  return agent;
}
