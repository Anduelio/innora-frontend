import type { ReactNode } from 'react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/atoms/Button/Button'
import { IconDownload } from '@/components/atoms/Icon/icons'
import { Card } from '@/components/molecules/Card/Card'
import s from './report.module.scss'

export function MetricCard({
  title,
  definition,
  basis,
  icon,
  badge,
  onExport,
  wide = false,
  children,
}: {
  title: string
  definition: string
  basis?: string
  icon?: ReactNode
  badge?: ReactNode
  onExport?: () => void
  wide?: boolean
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <div className={clsx(s.cell, wide && s.wide)}>
      <Card
        title={title}
        description={definition}
        icon={icon}
        actions={
          onExport ? (
            <Button
              variant="secondary"
              icon={<IconDownload size={18} />}
              onClick={onExport}
              aria-label={t('raportet.exportLabel', { title })}
              data-print-hide
            >
              {t('common.exportCsv')}
            </Button>
          ) : null
        }
      >
        {basis || badge ? (
          <p className={s.basis}>
            {badge}
            {basis ? <span>{t('raportet.basis.label', { basis })}</span> : null}
          </p>
        ) : null}
        {children}
      </Card>
    </div>
  )
}
