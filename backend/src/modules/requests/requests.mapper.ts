import { formatCode } from "../../shared/utils/formatCode";
import type { RequestWithRelations } from "./requests.repository";

export type RequestResponse = {
  id: number;
  code: string;
  title: string;
  description: string;
  status: RequestWithRelations["status"];
  category: RequestWithRelations["category"];
  requester: RequestWithRelations["requester"];
  createdAt: string;
  updatedAt: string;
};

export function toRequestResponse(request: RequestWithRelations): RequestResponse {
  return {
    id: request.id,
    code: formatCode(request.id),
    title: request.title,
    description: request.description,
    status: request.status,
    category: request.category,
    requester: request.requester,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  };
}
