import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { createCategory, createUser, loginAs } from "./helpers";

const validPayload = {
  title: "Impressora sem toner",
  description: "A impressora do 2º andar parou de imprimir.",
  categoryId: 1,
};

describe("POST /api/requests", () => {
  it("cria com dados válidos → 201, status ABERTO e solicitante = usuário logado", async () => {
    const user = await createUser({
      username: "ana.silva",
      password: "senha123",
      name: "Ana Silva",
    });
    const category = await createCategory("TI");
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    const res = await agent.post("/api/requests").send({
      ...validPayload,
      categoryId: category.id,
      requesterId: 999,
      status: "CONCLUIDO",
    });

    expect(res.status).toBe(201);
    expect(res.body.request).toMatchObject({
      title: validPayload.title,
      description: validPayload.description,
      status: "ABERTO",
      code: expect.stringMatching(/^SOL-\d{6}$/),
      category: { id: category.id, name: "TI" },
      requester: { id: user.id, name: "Ana Silva" },
    });
    expect(res.body.request.requester.id).toBe(user.id);
    expect(res.body.request.status).toBe("ABERTO");
  });

  it("retorna 400 com details para título curto", async () => {
    await createUser({ username: "ana.silva", password: "senha123" });
    const category = await createCategory("TI");
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    const res = await agent.post("/api/requests").send({
      title: "ab",
      description: validPayload.description,
      categoryId: category.id,
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "title" })]),
    );
  });

  it("retorna 400 com details para descrição vazia", async () => {
    await createUser({ username: "ana.silva", password: "senha123" });
    const category = await createCategory("TI");
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    const res = await agent.post("/api/requests").send({
      title: validPayload.title,
      description: "",
      categoryId: category.id,
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "description" })]),
    );
  });

  it("retorna 404 para categoria inexistente", async () => {
    await createUser({ username: "ana.silva", password: "senha123" });
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    const res = await agent.post("/api/requests").send({
      ...validPayload,
      categoryId: 9999,
    });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("retorna 401 sem login", async () => {
    const res = await request(app).post("/api/requests").send(validPayload);

    expect(res.status).toBe(401);
  });
});

describe("GET /api/requests/:id", () => {
  it("retorna 200 para id existente", async () => {
    await createUser({ username: "ana.silva", password: "senha123", name: "Ana Silva" });
    const category = await createCategory("TI");
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    const created = await agent.post("/api/requests").send({
      ...validPayload,
      categoryId: category.id,
    });
    const id = created.body.request.id as number;

    const res = await agent.get(`/api/requests/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.request).toMatchObject({
      id,
      code: `SOL-${String(id).padStart(6, "0")}`,
      title: validPayload.title,
      status: "ABERTO",
    });
  });

  it("retorna 404 para id inexistente", async () => {
    await createUser({ username: "ana.silva", password: "senha123" });
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    const res = await agent.get("/api/requests/9999");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("retorna 400 para id inválido (abc)", async () => {
    await createUser({ username: "ana.silva", password: "senha123" });
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    const res = await agent.get("/api/requests/abc");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "id" })]),
    );
  });

  it("retorna 401 sem login", async () => {
    const res = await request(app).get("/api/requests/1");

    expect(res.status).toBe(401);
  });
});
