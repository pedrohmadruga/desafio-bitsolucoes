import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import {
  createCategory,
  createServiceRequest,
  createUser,
  loginAs,
} from "./helpers";

describe("GET /api/dashboard", () => {
  it("banco vazio → tudo 0", async () => {
    await createUser({ username: "ana.silva", password: "senha123" });
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    const res = await agent.get("/api/dashboard");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      total: 0,
      aberto: 0,
      emAtendimento: 0,
      concluido: 0,
    });
  });

  it("com 3 solicitações em status distintos → valores corretos", async () => {
    const user = await createUser({ username: "ana.silva", password: "senha123" });
    const category = await createCategory("TI");
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    await createServiceRequest({
      title: "Aberta",
      categoryId: category.id,
      requesterId: user.id,
      status: "ABERTO",
    });
    await createServiceRequest({
      title: "Em atendimento",
      categoryId: category.id,
      requesterId: user.id,
      status: "EM_ATENDIMENTO",
    });
    await createServiceRequest({
      title: "Concluída",
      categoryId: category.id,
      requesterId: user.id,
      status: "CONCLUIDO",
    });

    const res = await agent.get("/api/dashboard");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      total: 3,
      aberto: 1,
      emAtendimento: 1,
      concluido: 1,
    });
  });

  it("retorna 401 sem login", async () => {
    const res = await request(app).get("/api/dashboard");

    expect(res.status).toBe(401);
  });
});
