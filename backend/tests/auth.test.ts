import jwt from "jsonwebtoken";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { env } from "../src/config/env";
import { createUser, loginAs } from "./helpers";

describe("POST /api/auth/login", () => {
  it("autentica com credenciais válidas e define cookie httpOnly", async () => {
    await createUser({ username: "ana.silva", password: "senha123", name: "Ana Silva" });

    const res = await request(app).post("/api/auth/login").send({
      username: "ana.silva",
      password: "senha123",
    });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      username: "ana.silva",
      name: "Ana Silva",
    });
    expect(res.body.user).not.toHaveProperty("passwordHash");

    const setCookie = res.headers["set-cookie"];
    expect(setCookie).toBeDefined();
    expect(setCookie[0]).toMatch(/token=/);
    expect(setCookie[0]).toMatch(/HttpOnly/i);
  });

  it("retorna 401 com mensagem genérica para senha incorreta", async () => {
    await createUser({ username: "ana.silva", password: "senha123" });

    const res = await request(app).post("/api/auth/login").send({
      username: "ana.silva",
      password: "errada",
    });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Usuário ou senha inválidos");
  });

  it("retorna 401 com a mesma mensagem para usuário inexistente", async () => {
    const res = await request(app).post("/api/auth/login").send({
      username: "nao.existe",
      password: "senha123",
    });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Usuário ou senha inválidos");
  });

  it("retorna 400 com details quando o body é inválido", async () => {
    const res = await request(app).post("/api/auth/login").send({
      password: "senha123",
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "username" }),
      ]),
    );
  });
});

describe("GET /api/auth/me", () => {
  it("retorna 401 sem cookie", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
  });

  it("retorna 200 com cookie válido", async () => {
    await createUser({ username: "ana.silva", password: "senha123", name: "Ana Silva" });
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    const res = await agent.get("/api/auth/me");

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      username: "ana.silva",
      name: "Ana Silva",
    });
  });
});

describe("POST /api/auth/logout", () => {
  it("retorna 204 e /me volta a dar 401", async () => {
    await createUser({ username: "ana.silva", password: "senha123" });
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    const logoutRes = await agent.post("/api/auth/logout");
    expect(logoutRes.status).toBe(204);

    const meRes = await agent.get("/api/auth/me");
    expect(meRes.status).toBe(401);
  });
});

describe("authenticate com cookie inválido", () => {
  it("retorna 401 para cookie adulterado", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", ["token=token-invalido-adulterado"]);

    expect(res.status).toBe(401);
  });

  it("retorna 401 para cookie expirado", async () => {
    const user = await createUser({ username: "ana.silva", password: "senha123" });

    const expiredToken = jwt.sign({ sub: user.id }, env.JWT_SECRET, {
      expiresIn: -1,
    });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", [`token=${expiredToken}`]);

    expect(res.status).toBe(401);
  });
});
