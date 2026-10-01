import { rateLimit } from "express-rate-limit";
import { env } from "../config/env";

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Muitas tentativas de login. Tente novamente mais tarde.",
      },
    });
  },
});
