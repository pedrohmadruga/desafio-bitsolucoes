import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET deve ter ao menos 16 caracteres"),
  JWT_EXPIRES_IN: z.string().default("8h"),
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Variáveis de ambiente inválidas ou ausentes:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
