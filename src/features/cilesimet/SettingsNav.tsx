import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { SECTIONS, sectionIcons, type SectionKey } from './sections'
import s from './CilesimetPage.module.scss'

function NavItem({ value, selected, onSelect }: { value: SectionKey; selected: boolean; onSelect: (value: SectionKey) => void }) {
  const { t } = useTranslation()
  const Icon = sectionIcons[value]
  return (
    <li>
      <button
        type="button"
        className={clsx(s.navItem, selected && s.navItemActive)}
        aria-current={selected ? 'true' : undefined}
        onClick={() => onSelect(value)}
      >
        <Icon />
        <span>{t(`cilesimet.sections.${value}`)}</span>
      </button>
    </li>
  )
}

export function SettingsNav({ value, onSelect }: { value: SectionKey; onSelect: (value: SectionKey) => void }) {
  const { t } = useTranslation()
  return (
    <nav className={s.nav} aria-label={t('cilesimet.navLabel')}>
      <ul className={s.navList}>
        {SECTIONS.map((key) => (
          <NavItem key={key} value={key} selected={key === value} onSelect={onSelect} />
        ))}
      </ul>
    </nav>
  )
}
