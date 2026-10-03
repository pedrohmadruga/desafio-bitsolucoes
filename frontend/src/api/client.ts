import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url: string = error.config?.url ?? ''
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/me')
    if (error.response?.status === 401 && !isAuthCall) {
      window.dispatchEvent(new Event('auth:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error?.message ??
      'Não foi possível concluir a operação.'
    )
  }
  return 'Ocorreu um erro inesperado.'
}
