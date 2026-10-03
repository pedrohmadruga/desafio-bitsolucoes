import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type ToastTone = 'success' | 'error' | 'info'

type ToastItem = {
  id: number
  message: string
  tone: ToastTone
}

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneClasses: Record<ToastTone, string> = {
  success: 'border-status-open-fg/30 bg-status-open-bg text-status-open-fg',
  error: 'border-danger/30 bg-red-50 text-danger',
  info: 'border-status-done-fg/30 bg-status-done-bg text-status-done-fg',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((current) => [...current, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 3500)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-stretch gap-2 p-4 md:inset-x-auto md:right-4 md:items-end"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={[
              'pointer-events-auto w-full max-w-sm rounded-md border px-4 py-3 text-sm font-medium shadow-md md:min-w-72',
              toneClasses[toast.tone],
            ].join(' ')}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider')
  }
  return context
}

/** Alerta estático para mensagens inline (ex.: erro de formulário da API). */
export function Alert({
  message,
  tone = 'error',
  className = '',
}: {
  message: string
  tone?: ToastTone
  className?: string
}) {
  return (
    <div
      role="alert"
      className={[
        'w-full rounded-md border px-3 py-2 text-sm',
        toneClasses[tone],
        className,
      ].join(' ')}
    >
      {message}
    </div>
  )
}
