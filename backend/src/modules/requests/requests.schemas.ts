import { z } from "zod";

const requestStatusEnum = z.enum(["ABERTO", "EM_ATENDIMENTO", "CONCLUIDO"]);

const titleSchema = z
  .string()
  .trim()
  .min(3, "Título deve ter no mínimo 3 caracteres")
  .max(150, "Título deve ter no máximo 150 caracteres");

const descriptionSchema = z
  .string()
  .trim()
  .min(10, "Descrição deve ter no mínimo 10 caracteres")
  .max(2000, "Descrição deve ter no máximo 2000 caracteres");

const categoryIdSchema = z
  .number({ error: "Categoria é obrigatória" })
  .int("Categoria inválida")
  .positive("Categoria inválida");

export const createRequestSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  categoryId: categoryIdSchema,
});

export const updateRequestSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  categoryId: categoryIdSchema,
});

export const changeStatusSchema = z.object({
  status: requestStatusEnum,
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive("Id inválido"),
});

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD");

export const listRequestsQuerySchema = z
  .object({
    from: dateOnly.optional(),
    to: dateOnly.optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    status: requestStatusEnum.optional(),
    q: z.string().trim().min(1).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
  })
  .refine((d) => !d.from || !d.to || d.from <= d.to, {
    message: "A data inicial não pode ser maior que a final",
    path: ["from"],
  });

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
export type ListRequestsQuery = z.infer<typeof listRequestsQuerySchema>;
