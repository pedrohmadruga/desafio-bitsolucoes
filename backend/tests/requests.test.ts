import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import {
  createCategory,
  createServiceRequest,
  createUser,
  loginAs,
} from "./helpers";

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

describe("GET /api/requests (listagem)", () => {
  it("sem filtros retorna tudo paginado, do mais recente ao mais antigo", async () => {
    const user = await createUser({ username: "ana.silva", password: "senha123" });
    const category = await createCategory("TI");
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    const older = await createServiceRequest({
      title: "Solicitação antiga",
      categoryId: category.id,
      requesterId: user.id,
      createdAt: new Date("2026-09-01T12:00:00.000Z"),
    });
    const newer = await createServiceRequest({
      title: "Solicitação recente",
      categoryId: category.id,
      requesterId: user.id,
      createdAt: new Date("2026-09-20T12:00:00.000Z"),
    });

    const res = await agent.get("/api/requests");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].id).toBe(newer.id);
    expect(res.body.data[1].id).toBe(older.id);
    expect(res.body.meta).toEqual({
      page: 1,
      pageSize: 10,
      total: 2,
      totalPages: 1,
    });
  });

  it("filtra por status", async () => {
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

    const res = await agent.get("/api/requests").query({ status: "EM_ATENDIMENTO" });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe("Em atendimento");
    expect(res.body.data[0].status).toBe("EM_ATENDIMENTO");
  });

  it("filtra por categoria", async () => {
    const user = await createUser({ username: "ana.silva", password: "senha123" });
    const ti = await createCategory("TI");
    const rh = await createCategory("RH");
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    await createServiceRequest({
      title: "Chamado TI",
      categoryId: ti.id,
      requesterId: user.id,
    });
    await createServiceRequest({
      title: "Chamado RH",
      categoryId: rh.id,
      requesterId: user.id,
    });

    const res = await agent.get("/api/requests").query({ categoryId: rh.id });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].category.id).toBe(rh.id);
  });

  it("filtra por texto no título (case-insensitive, parcial)", async () => {
    const user = await createUser({ username: "ana.silva", password: "senha123" });
    const category = await createCategory("TI");
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    await createServiceRequest({
      title: "Impressora do 2º andar",
      categoryId: category.id,
      requesterId: user.id,
    });
    await createServiceRequest({
      title: "Notebook novo",
      categoryId: category.id,
      requesterId: user.id,
    });

    const res = await agent.get("/api/requests").query({ q: "impressora" });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toMatch(/Impressora/i);
  });

  it("filtra por período incluindo o último dia do intervalo", async () => {
    const user = await createUser({ username: "ana.silva", password: "senha123" });
    const category = await createCategory("TI");
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    // 2026-09-30 23:30 em UTC-3 = 2026-10-01 02:30 UTC
    const inside = await createServiceRequest({
      title: "Dentro do período",
      categoryId: category.id,
      requesterId: user.id,
      createdAt: new Date("2026-10-01T02:30:00.000Z"),
    });
    await createServiceRequest({
      title: "Fora do período",
      categoryId: category.id,
      requesterId: user.id,
      createdAt: new Date("2026-10-02T03:00:00.000Z"),
    });

    const res = await agent
      .get("/api/requests")
      .query({ from: "2026-09-01", to: "2026-09-30" });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(inside.id);
  });

  it("aplica filtros combinados", async () => {
    const user = await createUser({ username: "ana.silva", password: "senha123" });
    const ti = await createCategory("TI");
    const rh = await createCategory("RH");
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    await createServiceRequest({
      title: "Impressora aberta TI",
      categoryId: ti.id,
      requesterId: user.id,
      status: "ABERTO",
      createdAt: new Date("2026-09-15T15:00:00.000Z"),
    });
    await createServiceRequest({
      title: "Impressora concluída TI",
      categoryId: ti.id,
      requesterId: user.id,
      status: "CONCLUIDO",
      createdAt: new Date("2026-09-15T15:00:00.000Z"),
    });
    await createServiceRequest({
      title: "Impressora aberta RH",
      categoryId: rh.id,
      requesterId: user.id,
      status: "ABERTO",
      createdAt: new Date("2026-09-15T15:00:00.000Z"),
    });

    const res = await agent.get("/api/requests").query({
      status: "ABERTO",
      categoryId: ti.id,
      q: "impressora",
      from: "2026-09-01",
      to: "2026-09-30",
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe("Impressora aberta TI");
  });

  it("retorna 400 quando from > to", async () => {
    await createUser({ username: "ana.silva", password: "senha123" });
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    const res = await agent
      .get("/api/requests")
      .query({ from: "2026-09-30", to: "2026-09-01" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("retorna 400 para status inválido", async () => {
    await createUser({ username: "ana.silva", password: "senha123" });
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    const res = await agent.get("/api/requests").query({ status: "INVALIDO" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("retorna 400 para page=0", async () => {
    await createUser({ username: "ana.silva", password: "senha123" });
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    const res = await agent.get("/api/requests").query({ page: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("retorna 400 para pageSize=1000", async () => {
    await createUser({ username: "ana.silva", password: "senha123" });
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    const res = await agent.get("/api/requests").query({ pageSize: 1000 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("pagina corretamente (page=2 e meta.totalPages)", async () => {
    const user = await createUser({ username: "ana.silva", password: "senha123" });
    const category = await createCategory("TI");
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    for (let i = 1; i <= 3; i++) {
      await createServiceRequest({
        title: `Solicitação número ${i}`,
        categoryId: category.id,
        requesterId: user.id,
        createdAt: new Date(`2026-09-0${i}T12:00:00.000Z`),
      });
    }

    const res = await agent.get("/api/requests").query({ page: 2, pageSize: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toEqual({
      page: 2,
      pageSize: 2,
      total: 3,
      totalPages: 2,
    });
  });

  it("retorna 401 sem login", async () => {
    const res = await request(app).get("/api/requests");

    expect(res.status).toBe(401);
  });
});

describe("PUT /api/requests/:id", () => {
  it("dono edita solicitação aberta → 200 e updatedAt muda", async () => {
    const user = await createUser({ username: "ana.silva", password: "senha123" });
    const category = await createCategory("TI");
    const otherCategory = await createCategory("RH");
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    const created = await createServiceRequest({
      title: "Título original",
      description: "Descrição original com tamanho suficiente.",
      categoryId: category.id,
      requesterId: user.id,
      status: "ABERTO",
    });

    // pequena pausa para garantir diferença de timestamp no updatedAt
    await new Promise((r) => setTimeout(r, 20));

    const res = await agent.put(`/api/requests/${created.id}`).send({
      title: "Título atualizado",
      description: "Descrição atualizada com tamanho suficiente.",
      categoryId: otherCategory.id,
    });

    expect(res.status).toBe(200);
    expect(res.body.request).toMatchObject({
      id: created.id,
      title: "Título atualizado",
      description: "Descrição atualizada com tamanho suficiente.",
      category: { id: otherCategory.id, name: "RH" },
      status: "ABERTO",
    });
    expect(new Date(res.body.request.updatedAt).getTime()).toBeGreaterThan(
      created.updatedAt.getTime(),
    );
  });

  it("outro usuário tenta editar → 403", async () => {
    const owner = await createUser({ username: "ana.silva", password: "senha123" });
    await createUser({ username: "carlos.souza", password: "senha123" });
    const category = await createCategory("TI");

    const created = await createServiceRequest({
      title: "Só da Ana",
      categoryId: category.id,
      requesterId: owner.id,
      status: "ABERTO",
    });

    const agent = await loginAs({ username: "carlos.souza", password: "senha123" });
    const res = await agent.put(`/api/requests/${created.id}`).send({
      title: "Tentativa do Carlos",
      description: "Descrição alterada sem ser o dono da solicitação.",
      categoryId: category.id,
    });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("editar solicitação em atendimento → 409 REQUEST_NOT_OPEN", async () => {
    const user = await createUser({ username: "ana.silva", password: "senha123" });
    const category = await createCategory("TI");
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    const created = await createServiceRequest({
      title: "Em atendimento",
      categoryId: category.id,
      requesterId: user.id,
      status: "EM_ATENDIMENTO",
    });

    const res = await agent.put(`/api/requests/${created.id}`).send({
      title: "Não deveria editar",
      description: "Descrição que não deve ser aceita nesta situação.",
      categoryId: category.id,
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("REQUEST_NOT_OPEN");
  });

  it("editar solicitação concluída → 409 REQUEST_NOT_OPEN", async () => {
    const user = await createUser({ username: "ana.silva", password: "senha123" });
    const category = await createCategory("TI");
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    const created = await createServiceRequest({
      title: "Concluída",
      categoryId: category.id,
      requesterId: user.id,
      status: "CONCLUIDO",
    });

    const res = await agent.put(`/api/requests/${created.id}`).send({
      title: "Não deveria editar",
      description: "Descrição que não deve ser aceita nesta situação.",
      categoryId: category.id,
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("REQUEST_NOT_OPEN");
  });

  it("body inválido → 400", async () => {
    const user = await createUser({ username: "ana.silva", password: "senha123" });
    const category = await createCategory("TI");
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    const created = await createServiceRequest({
      title: "Válida",
      categoryId: category.id,
      requesterId: user.id,
    });

    const res = await agent.put(`/api/requests/${created.id}`).send({
      title: "ab",
      description: "curta",
      categoryId: category.id,
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("inexistente → 404", async () => {
    await createUser({ username: "ana.silva", password: "senha123" });
    const category = await createCategory("TI");
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    const res = await agent.put("/api/requests/9999").send({
      title: "Título válido longo",
      description: "Descrição válida com tamanho suficiente.",
      categoryId: category.id,
    });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

describe("DELETE /api/requests/:id", () => {
  it("dono exclui aberta → 204 e depois GET → 404", async () => {
    const user = await createUser({ username: "ana.silva", password: "senha123" });
    const category = await createCategory("TI");
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    const created = await createServiceRequest({
      title: "Para excluir",
      categoryId: category.id,
      requesterId: user.id,
      status: "ABERTO",
    });

    const del = await agent.delete(`/api/requests/${created.id}`);
    expect(del.status).toBe(204);

    const get = await agent.get(`/api/requests/${created.id}`);
    expect(get.status).toBe(404);
  });

  it("outro usuário tenta excluir → 403", async () => {
    const owner = await createUser({ username: "ana.silva", password: "senha123" });
    await createUser({ username: "carlos.souza", password: "senha123" });
    const category = await createCategory("TI");

    const created = await createServiceRequest({
      title: "Não é do Carlos",
      categoryId: category.id,
      requesterId: owner.id,
      status: "ABERTO",
    });

    const agent = await loginAs({ username: "carlos.souza", password: "senha123" });
    const res = await agent.delete(`/api/requests/${created.id}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("excluir solicitação não aberta → 409", async () => {
    const user = await createUser({ username: "ana.silva", password: "senha123" });
    const category = await createCategory("TI");
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    const created = await createServiceRequest({
      title: "Já em atendimento",
      categoryId: category.id,
      requesterId: user.id,
      status: "EM_ATENDIMENTO",
    });

    const res = await agent.delete(`/api/requests/${created.id}`);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("REQUEST_NOT_OPEN");
  });
});
