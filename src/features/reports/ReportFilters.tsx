import { useTranslation } from 'react-i18next'
import type { RoomTypeInfo } from '@/types/domain'
import { PERIOD_PRESETS, REPORT_SOURCES } from '@/lib/reports'
import { Button } from '@/components/atoms/Button/Button'
import { IconPrinter } from '@/components/atoms/Icon/icons'
import { Select } from '@/components/atoms/Select/Select'
import { DatePicker } from '@/components/molecules/DatePicker/DatePicker'
import { Field } from '@/components/molecules/Field/Field'
import { SegmentedControl } from '@/components/molecules/SegmentedControl/SegmentedControl'
import type { useReportParams } from '@/features/reports/useReportParams'
import s from './ReportFilters.module.scss'

export function ReportFilters({
  params,
  roomTypes,
}: {
  params: ReturnType<typeof useReportParams>
  roomTypes: readonly RoomTypeInfo[]
}) {
  const { t } = useTranslation()
  const presets = PERIOD_PRESETS.map((value) => ({
    value,
    label: t(`raportet.filters.presets.${value}`),
  }))

  return (
    <section className={s.bar} aria-label={t('raportet.filters.label')} data-print-hide>
      <div className={s.top}>
        <div className={s.presets}>
          <SegmentedControl
            value={params.preset}
            options={presets}
            onChange={params.setPreset}
            label={t('raportet.filters.period')}
          />
        </div>
        <Button variant="secondary" icon={<IconPrinter size={18} />} onClick={() => window.print()}>
          {t('common.print')}
        </Button>
      </div>

      <div className={s.fields}>
        {params.preset === 'custom' ? (
          <>
            <Field label={t('common.from')} htmlFor="report-from">
              <DatePicker id="report-from" label={t('common.from')} value={params.start} onChange={params.setFrom} />
            </Field>
            <Field label={t('common.to')} htmlFor="report-to">
              <DatePicker
                id="report-to"
                label={t('common.to')}
                value={params.end}
                min={params.start}
                onChange={params.setTo}
                align="end"
              />
            </Field>
          </>
        ) : null}
        <Field label={t('raportet.filters.roomType')} htmlFor="report-room-type">
          <Select
            id="report-room-type"
            value={params.roomTypeId ?? ''}
            onChange={(event) => params.setRoomType(event.target.value)}
          >
            <option value="">{t('raportet.filters.allRoomTypes')}</option>
            {roomTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('raportet.filters.source')} htmlFor="report-source">
          <Select
            id="report-source"
            value={params.source ?? ''}
            onChange={(event) => params.setSource(event.target.value)}
          >
            <option value="">{t('raportet.filters.allSources')}</option>
            {REPORT_SOURCES.map((source) => (
              <option key={source} value={source}>
                {t(`source.${source}`)}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </section>
  )
}
