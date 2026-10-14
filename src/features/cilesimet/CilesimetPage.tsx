import { useCallback, useMemo, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { Tabs, tabPanelProps } from '@/components/molecules/Tabs/Tabs'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { AppearanceSection } from './AppearanceSection'
import { BlocksSection } from './BlocksSection'
import { BookingSection } from './BookingSection'
import { HotelSection } from './HotelSection'
import { RoomsSection } from './RoomsSection'
import { DESKTOP_QUERY, SECTION_PARAM, SECTIONS, toSection, type SectionKey } from './sections'
import { SettingsNav } from './SettingsNav'
import { UsersSection } from './UsersSection'
import s from './CilesimetPage.module.scss'

const TABS_ID = 'cilesimet'

const sectionComponents: Record<SectionKey, ComponentType> = {
  hoteli: HotelSection,
  dhomat: RoomsSection,
  mirembajtje: BlocksSection,
  booking: BookingSection,
  perdoruesit: UsersSection,
  pamja: AppearanceSection,
}

export function CilesimetPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const section = toSection(searchParams.get(SECTION_PARAM))
  const isDesktop = useMediaQuery(DESKTOP_QUERY)

  const selectSection = useCallback(
    (next: SectionKey) => {
      setSearchParams(
        (previous) => {
          const params = new URLSearchParams(previous)
          params.set(SECTION_PARAM, next)
          return params
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const tabItems = useMemo(() => SECTIONS.map((value) => ({ value, label: t(`cilesimet.tabs.${value}`) })), [t])

  const Section = sectionComponents[section]

  if (isDesktop) {
    return (
      <div className={s.layout}>
        <SettingsNav value={section} onSelect={selectSection} />
        <div className={s.content}>
          <Section />
        </div>
      </div>
    )
  }

  return (
    <div className={s.page}>
      <Tabs items={tabItems} value={section} onChange={selectSection} label={t('cilesimet.navLabel')} idPrefix={TABS_ID} />
      <div className={s.panel} {...tabPanelProps(TABS_ID, section)}>
        <Section />
      </div>
    </div>
  )
}
