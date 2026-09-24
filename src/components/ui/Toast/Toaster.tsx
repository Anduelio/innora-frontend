import { useEffect } from 'react'
import { useUiStore } from '@/store/uiStore'
import s from './Toaster.module.scss'

export function Toaster() {
  const toast = useUiStore((state) => state.toast)
  const dismissToast = useUiStore((state) => state.dismissToast)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(dismissToast, 3600)
    return () => window.clearTimeout(timer)
  }, [toast, dismissToast])

  if (!toast) return null

  return (
    <div className={s.toast} role="status" aria-live="polite">
      {toast.lines.map((line, index) => (
        <p key={`${toast.id}-${index}`} className={s.line}>
          <span className={s.mark} aria-hidden="true">
            ✓
          </span>
          {line}
        </p>
      ))}
    </div>
  )
}
