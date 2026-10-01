import { execSync } from "node:child_process";
import path from "node:path";
import { config } from "dotenv";
import { afterAll, beforeAll, beforeEach } from "vitest";

// Carrega o ambiente de teste ANTES de qualquer import de app/prisma/env
config({
  path: path.resolve(process.cwd(), ".env.test"),
  override: true,
});

beforeAll(async () => {
  const { Client } = await import("pg");
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL ausente após carregar .env.test");
  }

  const adminUrl = databaseUrl.replace(/([?&])schema=[^&]*&?/, "$1").replace(/[?&]$/, "");
  const client = new Client({ connectionString: adminUrl });
  await client.connect();
  await client.query("CREATE SCHEMA IF NOT EXISTS test");
  await client.end();

  execSync("npx prisma migrate deploy", {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });
});

beforeEach(async () => {
  const { prisma } = await import("../src/database/prisma");
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "service_requests", "categories", "users" RESTART IDENTITY CASCADE',
  );
});

afterAll(async () => {
  const { prisma } = await import("../src/database/prisma");
  await prisma.$disconnect();
});
