import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { createUser, loginAs, seedCategories, SEED_CATEGORIES } from "./helpers";

describe("GET /api/categories", () => {
  it("retorna 401 sem login", async () => {
    const res = await request(app).get("/api/categories");

    expect(res.status).toBe(401);
  });

  it("retorna 200 com as 5 categorias ordenadas por nome", async () => {
    await createUser({ username: "ana.silva", password: "senha123" });
    await seedCategories();
    const agent = await loginAs({ username: "ana.silva", password: "senha123" });

    const res = await agent.get("/api/categories");

    expect(res.status).toBe(200);
    expect(res.body.categories).toHaveLength(5);

    const names = res.body.categories.map((c: { name: string }) => c.name);
    expect(names).toEqual([...SEED_CATEGORIES].sort((a, b) => a.localeCompare(b)));

    for (const category of res.body.categories) {
      expect(category).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
        }),
      );
    }
  });
});
