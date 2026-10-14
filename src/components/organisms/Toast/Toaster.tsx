import { useEffect } from 'react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { IconCheckCircle, IconClose, IconInfo, IconXCircle } from '@/components/atoms/Icon/icons'
import { useUiStore } from '@/store/uiStore'
import s from './Toaster.module.scss'

const icons = { success: IconCheckCircle, error: IconXCircle, info: IconInfo }

export function Toaster() {
  const { t } = useTranslation()
  const toast = useUiStore((state) => state.toast)
  const dismissToast = useUiStore((state) => state.dismissToast)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(dismissToast, toast.tone === 'error' ? 7000 : 4000)
    return () => window.clearTimeout(timer)
  }, [toast, dismissToast])

  return (
    <div className={s.region} role="status" aria-live={toast?.tone === 'error' ? 'assertive' : 'polite'}>
      {toast ? (
        <div key={toast.id} className={clsx(s.toast, s[toast.tone])}>
          {(() => {
            const Icon = icons[toast.tone]
            return <Icon className={s.icon} />
          })()}
          <div className={s.lines}>
            {toast.lines.map((line, index) => (
              <p key={`${toast.id}-${index}`} className={index === 0 ? s.first : s.line}>
                {line}
              </p>
            ))}
          </div>
          <button type="button" className={s.close} aria-label={t('common.close')} onClick={dismissToast}>
            <IconClose size={16} />
          </button>
        </div>
      ) : null}
    </div>
  )
}
