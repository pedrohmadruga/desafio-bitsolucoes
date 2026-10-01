import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import * as requestsController from "./requests.controller";

export const requestsRoutes = Router();

requestsRoutes.use(authenticate);

requestsRoutes.post("/", requestsController.create);
requestsRoutes.get("/:id", requestsController.getById);
