import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { IconChevronLeft } from '@/components/atoms/Icon/icons'
import { sectionIcons, SETTINGS_ROOT, type SectionKey } from './sections'
import s from './SectionShell.module.scss'

/** Kapaku i çdo nënfaqeje: titull, përshkrim, veprime dhe, në celular, kthimi te lista. */
export function SectionShell({
  section,
  actions,
  children,
}: {
  section: SectionKey
  actions?: ReactNode
  children: ReactNode
}) {
  const { t } = useTranslation()
  const Icon = sectionIcons[section]
  return (
    <div className={s.shell}>
      <Link to={SETTINGS_ROOT} className={s.back}>
        <IconChevronLeft size={18} />
        {t('nav.cilesimet')}
      </Link>
      <header className={s.header}>
        <span className={s.icon}>
          <Icon size={22} />
        </span>
        <div className={s.heading}>
          <h2 className={s.title}>{t(`cilesimet.sections.${section}`)}</h2>
          <p className={s.description}>{t(`cilesimet.descriptions.${section}`)}</p>
        </div>
        {actions ? <div className={s.actions}>{actions}</div> : null}
      </header>
      <div className={s.content}>{children}</div>
    </div>
  )
}

/** Kartat e një seksioni në dy kolona në ekran të gjerë, në një kolonë më poshtë. */
export function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className={s.cardGrid}>{children}</div>
}

/** Kartë që zë gjithë gjerësinë e rrjetës. */
export function CardSpan({ children }: { children: React.ReactNode }) {
  return <div className={s.span}>{children}</div>
}
