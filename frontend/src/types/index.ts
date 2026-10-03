export type RequestStatus = 'ABERTO' | 'EM_ATENDIMENTO' | 'CONCLUIDO'

export type User = {
  id: number
  name: string
  username: string
}

export type Category = {
  id: number
  name: string
}

export type ServiceRequest = {
  id: number
  code: string
  title: string
  description: string
  status: RequestStatus
  category: Category
  requester: Pick<User, 'id' | 'name'>
  createdAt: string
  updatedAt: string
}

export type PaginatedMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type Paginated<T> = {
  data: T[]
  meta: PaginatedMeta
}

export type DashboardStats = {
  total: number
  aberto: number
  emAtendimento: number
  concluido: number
}
