import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import * as categoriesController from "./categories.controller";

export const categoriesRoutes = Router();

categoriesRoutes.get("/", authenticate, categoriesController.list);
