import type { RequestHandler } from "express";
import * as dashboardService from "./dashboard.service";

export const getStats: RequestHandler = async (_req, res) => {
  const stats = await dashboardService.getStats();
  res.status(200).json(stats);
};
