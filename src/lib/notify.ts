import { toast, type ExternalToast } from 'sonner'

export type NotifyKind = 'success' | 'error' | 'warning' | 'info'

/** Sa gjatë qëndron çdo lloj njoftimi; gabimet dhe paralajmërimet qëndrojnë më gjatë që të lexohen. */
const DURATION: Record<NotifyKind, number> = { success: 5000, info: 6000, warning: 8000, error: 10000 }

export interface NotifyOptions {
  /** Buton veprimi brenda njoftimit, p.sh. "Hap". */
  action?: { label: string; onClick: () => void }
  id?: string | number
}

function show(kind: NotifyKind, title: string, description?: string, options: NotifyOptions = {}) {
  const data: ExternalToast = {
    description,
    duration: DURATION[kind],
    id: options.id,
    action: options.action ? { label: options.action.label, onClick: options.action.onClick } : undefined,
  }
  return toast[kind](title, data)
}

export const notify = {
  success: (title: string, description?: string, options?: NotifyOptions) =>
    show('success', title, description, options),
  error: (title: string, description?: string, options?: NotifyOptions) => show('error', title, description, options),
  warning: (title: string, description?: string, options?: NotifyOptions) =>
    show('warning', title, description, options),
  info: (title: string, description?: string, options?: NotifyOptions) => show('info', title, description, options),
  dismiss: (id?: string | number) => toast.dismiss(id),
}

interface Message {
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

interface PromiseMessages<T> {
  loading: string
  success: Message | ((value: T) => Message)
  error: Message | ((error: unknown) => Message)
}

/**
 * Njoftim me gjendje: "Po ruhet…" → sukses ose gabim në të njëjtin kuti.
 * Kthen `true` kur veprimi u krye, `false` kur dështoi (pa hedhur gabim).
 */
export function notifyPromise<T>(promise: Promise<T>, messages: PromiseMessages<T>): Promise<boolean> {
  const resolve = <A>(value: Message | ((arg: A) => Message), arg: A) =>
    typeof value === 'function' ? value(arg) : value
  const view = (message: Message, kind: NotifyKind) => ({
    message: message.title,
    description: message.description,
    action: message.action,
    duration: DURATION[kind],
  })
  toast.promise(promise, {
    loading: messages.loading,
    success: (value) => view(resolve(messages.success, value), 'success'),
    error: (error) => view(resolve(messages.error, error), 'error'),
  })
  return promise.then(
    () => true,
    () => false,
  )
}
