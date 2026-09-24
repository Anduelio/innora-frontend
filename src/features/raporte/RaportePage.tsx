import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type ReportPreset } from '@/lib/api/reports'
import { TODAY } from '@/lib/date/today'
import { SegmentedControl } from '@/components/ui/SegmentedControl/SegmentedControl'
import { DailySection } from '@/features/raporte/sections/DailySection'
import { OccupancySection } from '@/features/raporte/sections/OccupancySection'
import { OutstandingSection } from '@/features/raporte/sections/OutstandingSection'
import { PaymentsSection } from '@/features/raporte/sections/PaymentsSection'
import { RevenueSection } from '@/features/raporte/sections/RevenueSection'
import { SourceSection } from '@/features/raporte/sections/SourceSection'
import s from './RaportePage.module.scss'

const presets: ReportPreset[] = ['today', 'this_week', 'this_month', 'last_month']

export function RaportePage() {
  const { t } = useTranslation()
  const [preset, setPreset] = useState<ReportPreset>('this_month')
  const [day, setDay] = useState(TODAY)

  return (
    <div className={s.page}>
      <SegmentedControl
        label={t('reports.range')}
        value={preset}
        onChange={(value) => setPreset(value)}
        options={presets.map((item) => ({ value: item, label: t(`reports.presets.${item}`) }))}
      />
      <RevenueSection preset={preset} />
      <PaymentsSection preset={preset} />
      <OutstandingSection preset={preset} />
      <SourceSection preset={preset} />
      <DailySection date={day} onDate={setDay} />
      <OccupancySection preset={preset} />
    </div>
  )
}
