import { useTranslation } from 'react-i18next'
import { Button } from '@/components/atoms/Button/Button'
import { IconRefresh } from '@/components/atoms/Icon/icons'
import { Skeleton } from '@/components/atoms/Skeleton/Skeleton'
import { VisuallyHidden } from '@/components/atoms/VisuallyHidden/VisuallyHidden'
import { Card } from '@/components/molecules/Card/Card'
import { EmptyState } from '@/components/molecules/EmptyState/EmptyState'
import s from './SectionShell.module.scss'

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
