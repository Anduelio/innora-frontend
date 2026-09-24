import { useTranslation } from 'react-i18next'
import { useRetrySync, useSimulateSyncProblem, useSyncStatus } from '@/lib/api/sync'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/ui/Button/Button'
import s from './SyncStatusCard.module.scss'

export function SyncStatusCard() {
  const { t } = useTranslation()
  const sync = useSyncStatus()
  const retry = useRetrySync()
  const simulate = useSimulateSyncProblem()
  const showToast = useUiStore((state) => state.showToast)
  const ok = sync.data?.ok !== false

  return (
    <section className={s.card}>
      <div className={s.head}>
        <span className={ok ? s.ok : s.warn} />
        <h2>{t('source.BOOKING')}</h2>
        <span className={ok ? s.okText : s.warnText}>{ok ? t('settings.synced') : t('settings.syncProblem')}</span>
      </div>
      <p className={s.copy}>{t('settings.bookingExplainer')}</p>
      {!ok ? (
        <div className={s.alert}>
          <span aria-hidden="true">⚠</span>
          <span>{sync.data?.message || t('settings.syncProblem')}</span>
          <Button
            variant="secondary"
            onClick={() =>
              retry.mutate(undefined, {
                onSuccess: () => showToast([t('toast.syncRestored')]),
                onError: () => showToast([t('toast.failed')]),
              })
            }
          >
            {t('actions.retry')}
          </Button>
        </div>
      ) : null}
      <button type="button" className={s.simulate} onClick={() => simulate.mutate()}>
        {t('settings.simulateProblem')}
      </button>
    </section>
  )
}
