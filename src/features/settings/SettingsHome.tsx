import { Link, Navigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { IconChevronRight } from '@/components/atoms/Icon/icons'
import { useCurrentUser } from '@/lib/api/auth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { DESKTOP_QUERY, SECTIONS, sectionIcons, sectionPath, sectionPermissions } from './sections'
import s from './SettingsHome.module.scss'

/**
 * Në kompjuter, nënfaqet janë në menunë e majtë, ndaj hapim të parën.
 * Në celular kjo është lista ku zgjidhet nënfaqja.
 */
export function SettingsHome() {
  const { t } = useTranslation()
  const { can } = useCurrentUser()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const allowed = SECTIONS.filter((key) => can(sectionPermissions[key]))

  if (isDesktop && allowed[0]) return <Navigate to={sectionPath(allowed[0])} replace />

  return (
    <ul className={s.list} aria-label={t('cilesimet.navLabel')}>
      {allowed.map((key) => {
        const Icon = sectionIcons[key]
        return (
          <li key={key}>
            <Link to={sectionPath(key)} className={s.item}>
              <span className={s.icon}>
                <Icon size={22} />
              </span>
              <span className={s.text}>
                <span className={s.title}>{t(`cilesimet.sections.${key}`)}</span>
                <span className={s.description}>{t(`cilesimet.descriptions.${key}`)}</span>
              </span>
              <IconChevronRight size={18} className={s.chevron} />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
