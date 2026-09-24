import type { ReactNode } from 'react'
import { useId } from 'react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { IconClose } from '@/components/icons'
import { IconButton } from '@/components/ui/IconButton/IconButton'
import { useDialog } from '@/lib/hooks/useDialog'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import s from './Drawer.module.scss'

export function Drawer({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean
  title: string
  onClose: () => void
  children?: ReactNode
  footer?: ReactNode
}) {
  const { t } = useTranslation()
  const titleId = useId()
  const ref = useDialog(open, onClose)
  const sheet = useMediaQuery('(max-width: 767px)')
  if (!open) return null

  return (
    <div className={clsx(s.backdrop, sheet && s.isSheet)} onMouseDown={onClose}>
      <div
        ref={ref}
        className={s.panel}
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
