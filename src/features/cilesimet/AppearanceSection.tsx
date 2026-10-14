import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { IconMonitor, IconMoon, IconSun } from '@/components/atoms/Icon/icons'
import { Card } from '@/components/molecules/Card/Card'
import { SegmentedControl } from '@/components/molecules/SegmentedControl/SegmentedControl'
import { useTheme, type ThemeChoice } from '@/lib/hooks/useTheme'
import page from './CilesimetPage.module.scss'

const themeIcons: Record<ThemeChoice, ReactNode> = {
  system: <IconMonitor />,
  light: <IconSun />,
  dark: <IconMoon />,
}

const THEMES: ThemeChoice[] = ['light', 'dark', 'system']

export function AppearanceSection() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const options = THEMES.map((value) => ({ value, label: t(`cilesimet.appearance.${value}`), icon: themeIcons[value] }))

  return (
    <Card title={t('cilesimet.sections.pamja')} description={t('cilesimet.appearance.description')} icon={<IconMonitor />}>
      <div className={page.stack}>
        <div className={page.field}>
          <p className={page.subheading}>{t('cilesimet.appearance.themeLabel')}</p>
          <SegmentedControl value={theme} options={options} onChange={setTheme} label={t('cilesimet.appearance.themeLabel')} block />
        </div>
        <p className={page.hint}>{t('cilesimet.appearance.hint')}</p>
      </div>
    </Card>
  )
}
