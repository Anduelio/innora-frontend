import type { ReactNode } from 'react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import type { CalendarView } from '@/types/domain'
import { usePersistentState } from '@/lib/hooks/usePersistentState'
import { useTheme, type ThemeChoice } from '@/lib/hooks/useTheme'
import { DEFAULT_VIEW_KEY } from '@/store/calendarStore'
import { IconCalendar, IconMonitor, IconMoon, IconSliders, IconSun } from '@/components/atoms/Icon/icons'
import { Card } from '@/components/molecules/Card/Card'
import { Field } from '@/components/molecules/Field/Field'
import { SegmentedControl } from '@/components/molecules/SegmentedControl/SegmentedControl'
import { CardGrid, SectionShell } from './SectionShell'
import s from './Appearance.module.scss'

const themeIcons: Record<ThemeChoice, ReactNode> = {
  system: <IconMonitor />,
  light: <IconSun />,
  dark: <IconMoon />,
}

const THEMES: ThemeChoice[] = ['light', 'dark', 'system']
const VIEWS: CalendarView[] = [1, 7, 30]

function ThemePreview({ theme }: { theme: ThemeChoice }) {
  const { t } = useTranslation()
  return (
    <ul className={s.previews} aria-label={t('cilesimet.appearance.themeLabel')}>
      {THEMES.map((value) => (
        <li key={value} className={clsx(s.preview, s[value])} data-selected={theme === value || undefined}>
          <span className={s.previewBar} />
          <span className={s.previewLine} />
          <span className={s.previewLineShort} />
          <span className={s.previewLabel}>{t(`cilesimet.appearance.${value}`)}</span>
        </li>
      ))}
    </ul>
  )
}

export function AppearanceSection() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const [view, setView] = usePersistentState<number>(DEFAULT_VIEW_KEY, 7)
  const themeOptions = THEMES.map((value) => ({
    value,
    label: t(`cilesimet.appearance.${value}`),
    icon: themeIcons[value],
  }))
  const viewOptions = VIEWS.map((value) => ({
    value,
    label: t(`cilesimet.appearance.views.${value}`),
  }))
  const currentView: CalendarView = view === 1 || view === 30 ? view : 7

  return (
    <SectionShell section="pamja">
      <CardGrid>
        <Card
          title={t('cilesimet.appearance.themeLabel')}
          description={t('cilesimet.appearance.hint')}
          icon={<IconSun />}
        >
          <div className={s.stack}>
            <SegmentedControl
              value={theme}
              options={themeOptions}
              onChange={setTheme}
              label={t('cilesimet.appearance.themeLabel')}
              block
            />
            <ThemePreview theme={theme} />
          </div>
        </Card>
        <Card
          title={t('cilesimet.appearance.calendarTitle')}
          description={t('cilesimet.appearance.calendarHint')}
          icon={<IconCalendar />}
        >
          <Field label={t('cilesimet.appearance.calendarView')} hint={t('cilesimet.appearance.calendarViewHint')}>
            <SegmentedControl<CalendarView>
              value={currentView}
              options={viewOptions}
              onChange={setView}
              label={t('cilesimet.appearance.calendarView')}
              block
            />
          </Field>
        </Card>
        <p className={s.footnote}>
          <IconSliders size={18} />
          {t('cilesimet.appearance.deviceNote')}
        </p>
      </CardGrid>
    </SectionShell>
  )
}
