import type { RequestHandler } from "express";
import * as categoriesService from "./categories.service";

export const list: RequestHandler = async (_req, res) => {
  const categories = await categoriesService.listCategories();
  res.status(200).json({ categories });
};
