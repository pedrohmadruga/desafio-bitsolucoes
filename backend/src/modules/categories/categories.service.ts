import * as categoriesRepository from "./categories.repository";

export async function listCategories() {
  return categoriesRepository.findAll();
}
