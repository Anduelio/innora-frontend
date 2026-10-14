import { useId, type ReactNode } from 'react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { IconClose } from '@/components/atoms/Icon/icons'
import { IconButton } from '@/components/atoms/IconButton/IconButton'
import { useDialog } from '@/lib/hooks/useDialog'
import s from './Sheet.module.scss'

export function Sheet({
  open,
  title,
  description,
  headerExtra,
  onClose,
  children,
  footer,
  size = 'md',
  mobile = 'full',
}: {
  open: boolean
  title: string
  description?: ReactNode
  headerExtra?: ReactNode
  onClose: () => void
  children?: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg'
  mobile?: 'full' | 'bottom'
}) {
  const { t } = useTranslation()
  const titleId = useId()
  const ref = useDialog(open, onClose)
  if (!open) return null

  return (
    <div className={clsx(s.backdrop, mobile === 'bottom' && s.mobileBottom)} onMouseDown={onClose}>
      <div
        ref={ref}
        className={clsx(s.panel, s[size])}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={s.header}>
          <div className={s.heading}>
            <h2 id={titleId} className={s.title}>
              {title}
            </h2>
            {description ? <div className={s.description}>{description}</div> : null}
          </div>
          <IconButton label={t('common.close')} onClick={onClose}>
            <IconClose />
          </IconButton>
          {headerExtra ? <div className={s.extra}>{headerExtra}</div> : null}
        </header>
        <div className={s.body}>{children}</div>
        {footer ? <footer className={s.footer}>{footer}</footer> : null}
      </div>
    </div>
  )
}
