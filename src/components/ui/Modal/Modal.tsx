import type { ReactNode } from 'react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { IconClose } from '@/components/icons'
import { IconButton } from '@/components/ui/IconButton/IconButton'
import { useDialog } from '@/lib/hooks/useDialog'
import s from './Modal.module.scss'

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  const { t } = useTranslation()
  const titleId = useId()
  const ref = useDialog(open, onClose)
  if (!open) return null

  return (
    <div className={s.backdrop} onMouseDown={onClose}>
      <div
        ref={ref}
        className={s.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={s.header}>
          <h2 id={titleId} className={s.title}>
            {title}
          </h2>
          <IconButton label={t('common.close')} tone="muted" onClick={onClose}>
            <IconClose />
          </IconButton>
        </header>
        <div className={s.body}>{children}</div>
        {footer ? <footer className={s.footer}>{footer}</footer> : null}
      </div>
    </div>
  )
}
