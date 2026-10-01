import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { loginRateLimit } from "../../middlewares/loginRateLimit";
import * as authController from "./auth.controller";

export const authRoutes = Router();

authRoutes.post("/login", loginRateLimit, authController.login);
authRoutes.post("/logout", authenticate, authController.logout);
authRoutes.get("/me", authenticate, authController.me);
