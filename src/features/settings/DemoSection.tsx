import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCustomers } from '@/lib/api/customers'
import { usePayments } from '@/lib/api/hotel'
import { useHotelReservations } from '@/lib/api/reservations'
import { useResetDemo } from '@/lib/api/settings'
import { TODAY } from '@/lib/date/today'
import { centsToDecimal } from '@/lib/reports'
import { Button } from '@/components/atoms/Button/Button'
import { IconDownload, IconRefresh } from '@/components/atoms/Icon/icons'
import { Alert } from '@/components/molecules/Alert/Alert'
import { Card } from '@/components/molecules/Card/Card'
import { StatTile } from '@/components/molecules/StatTile/StatTile'
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog/ConfirmDialog'
import { downloadCsv } from '@/features/reports/csv'
import { CardGrid, SectionShell } from './SectionShell'
import s from './Appearance.module.scss'
import { notifyPromise } from '@/lib/notify'
import { describeError } from '@/lib/describeError'

export function DemoSection() {
  const { t } = useTranslation()
  const reservations = useHotelReservations()
  const customers = useCustomers()
  const payments = usePayments('0000-01-01', '9999-12-31')
  const reset = useResetDemo()
  const [confirming, setConfirming] = useState(false)

  const exportReservations = () =>
    downloadCsv('rezervimet.csv', [
      [
        'Kodi',
        'Mysafiri',
        'Telefoni',
        'Mbërritja',
        'Largimi',
        'Dhoma',
        'Statusi',
        'Burimi',
        'Monedha',
        'Totali',
        'Paguar',
      ],
      ...(reservations.data ?? []).map((item) => [
        item.code,
        item.guestName,
        item.phone,
        item.checkIn,
        item.checkOut,
        item.roomId,
        t(`status.${item.status}`),
        t(`source.${item.source}`),
        item.currency,
        centsToDecimal(item.totalCents),
        centsToDecimal(item.paidCents),
      ]),
    ])

  const doReset = () =>
    void notifyPromise(reset.mutateAsync(), {
      loading: t('cilesimet.demo.resetting'),
      success: {
        title: t('cilesimet.demo.resetDone'),
        description: t('cilesimet.demo.resetDoneHint', { date: TODAY }),
      },
      error: describeError(t),
    }).then((ok) => {
      if (ok) setConfirming(false)
    })

  return (
    <SectionShell section="demo">
      <Alert tone="info" title={t('cilesimet.demo.noticeTitle')}>
        {t('cilesimet.demo.noticeText')}
      </Alert>
      <div className={s.tiles}>
        <StatTile
          label={t('cilesimet.demo.reservations')}
          value={reservations.data?.length ?? '…'}
          hint={t('cilesimet.demo.reservationsHint')}
        />
        <StatTile label={t('cilesimet.demo.customers')} value={customers.data?.length ?? '…'} />
        <StatTile label={t('cilesimet.demo.payments')} value={payments.data?.length ?? '…'} />
      </div>
      <CardGrid>
        <Card
          title={t('cilesimet.demo.exportTitle')}
          description={t('cilesimet.demo.exportText')}
          icon={<IconDownload />}
        >
          <Button
            variant="secondary"
            icon={<IconDownload />}
            disabled={!reservations.data}
            onClick={exportReservations}
          >
            {t('cilesimet.demo.exportButton')}
          </Button>
        </Card>
        <Card title={t('cilesimet.demo.resetTitle')} description={t('cilesimet.demo.resetText')} icon={<IconRefresh />}>
          <Button variant="danger" icon={<IconRefresh />} onClick={() => setConfirming(true)}>
            {t('cilesimet.demo.resetButton')}
          </Button>
        </Card>
      </CardGrid>
      <ConfirmDialog
        open={confirming}
        title={t('cilesimet.demo.resetConfirmTitle')}
        confirmLabel={t('cilesimet.demo.resetButton')}
        tone="danger"
        pending={reset.isPending}
        onConfirm={doReset}
        onClose={() => setConfirming(false)}
      >
        <p>{t('cilesimet.demo.resetConfirmText')}</p>
      </ConfirmDialog>
    </SectionShell>
  )
}
