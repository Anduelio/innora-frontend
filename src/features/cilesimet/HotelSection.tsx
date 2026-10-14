import { useTranslation } from 'react-i18next'
import { IconSettings } from '@/components/atoms/Icon/icons'
import { Card } from '@/components/molecules/Card/Card'
import { DescriptionList } from '@/components/molecules/DescriptionList/DescriptionList'
import { useHotelSettings } from '@/lib/api/rooms'
import { fmtDate } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { WIDE_QUERY } from './sections'
import { ReadOnlyNote, SectionError, SectionLoading } from './SectionStates'
import s from './CilesimetPage.module.scss'

export function HotelSection() {
  const { t } = useTranslation()
  const hotel = useHotelSettings()
  const wide = useMediaQuery(WIDE_QUERY)
  const title = t('cilesimet.sections.hoteli')

  if (hotel.isPending) return <SectionLoading title={title} rows={6} />
  if (hotel.isError) return <SectionError title={title} onRetry={() => void hotel.refetch()} />

  const { name, city, currency, checkInTime, checkOutTime, timezone } = hotel.data

  return (
    <div className={s.stack}>
      <Card title={title} description={t('cilesimet.hotel.description')} icon={<IconSettings />}>
        <DescriptionList
          columns={wide ? 2 : 1}
          items={[
            { label: t('cilesimet.hotel.name'), value: name, emphasis: true },
            { label: t('cilesimet.hotel.city'), value: city },
            {
              label: t('cilesimet.hotel.currency'),
              value: `${t(`cilesimet.hotel.currencies.${currency}`, { defaultValue: currency })} · ${currency}`,
            },
            { label: t('cilesimet.hotel.timezone'), value: t('cilesimet.hotel.timezoneValue', { zone: timezone }) },
            { label: t('cilesimet.hotel.checkIn'), value: t('cilesimet.hotel.fromTime', { time: checkInTime }) },
            { label: t('cilesimet.hotel.checkOut'), value: t('cilesimet.hotel.untilTime', { time: checkOutTime }) },
            {
              label: t('cilesimet.hotel.dateFormat'),
              value: t('cilesimet.hotel.dateFormatValue', { example: fmtDate(TODAY) }),
            },
            { label: t('cilesimet.hotel.weekStart'), value: t('cilesimet.hotel.weekStartValue') },
          ]}
        />
      </Card>
      <ReadOnlyNote />
    </div>
  )
}
