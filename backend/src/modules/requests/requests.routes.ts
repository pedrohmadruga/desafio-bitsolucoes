import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import * as requestsController from "./requests.controller";

export const requestsRoutes = Router();

requestsRoutes.use(authenticate);

requestsRoutes.post("/", requestsController.create);
requestsRoutes.get("/", requestsController.list);
requestsRoutes.get("/:id", requestsController.getById);
requestsRoutes.put("/:id", requestsController.update);
requestsRoutes.delete("/:id", requestsController.remove);
requestsRoutes.patch("/:id/status", requestsController.changeStatus);
