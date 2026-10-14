import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/atoms/Button/Button'
import { IconRefresh } from '@/components/atoms/Icon/icons'
import { Skeleton } from '@/components/atoms/Skeleton/Skeleton'
import { VisuallyHidden } from '@/components/atoms/VisuallyHidden/VisuallyHidden'
import { Alert } from '@/components/molecules/Alert/Alert'
import { Card } from '@/components/molecules/Card/Card'
import { EmptyState } from '@/components/molecules/EmptyState/EmptyState'
import s from './CilesimetPage.module.scss'

export function SectionLoading({ title, rows = 4 }: { title: string; rows?: number }) {
  const { t } = useTranslation()
  return (
    <Card title={title}>
      <div className={s.skeletons} role="status">
        <VisuallyHidden>{t('common.loading')}</VisuallyHidden>
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} height={20} width={index % 2 ? '60%' : '85%'} />
        ))}
      </div>
    </Card>
  )
}

export function SectionError({ title, onRetry }: { title: string; onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <Card title={title}>
      <EmptyState
        title={t('common.loadError')}
        description={t('common.loadErrorHint')}
        action={
          <Button variant="secondary" icon={<IconRefresh />} onClick={onRetry}>
            {t('common.retry')}
          </Button>
        }
      />
    </Card>
  )
}

export function ReadOnlyNote() {
  const { t } = useTranslation()
  return (
    <Alert tone="info" title={t('cilesimet.readOnly.title')}>
      {t('cilesimet.readOnly.text')} {t('common.ownerOnly')}
    </Alert>
  )
}

export function DisabledAction({ id, label, icon }: { id: string; label: string; icon?: ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className={s.disabledAction}>
      <Button variant="secondary" icon={icon} disabled aria-describedby={id}>
        {label}
      </Button>
      <p id={id} className={s.hint}>
        {t('cilesimet.backendHint')}
      </p>
    </div>
  )
}
