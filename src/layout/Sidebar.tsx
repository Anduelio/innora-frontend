import { NavLink } from 'react-router'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { IconBed, IconCalendar, IconGrid, IconList, IconSettings, IconUsers } from '@/components/icons'
import { useMe } from '@/lib/api/auth'
import { useSyncStatus } from '@/lib/api/sync'
import { useRooms } from '@/lib/api/rooms'
import s from './Sidebar.module.scss'

const links = [
  { to: '/', key: 'permbledhje', icon: IconGrid, end: true },
  { to: '/kalendari', key: 'kalendari', icon: IconCalendar, end: false },
  { to: '/rezervimet', key: 'rezervimet', icon: IconList, end: false },
  { to: '/dhomat', key: 'dhomat', icon: IconBed, end: false },
  { to: '/klientet', key: 'klientet', icon: IconUsers, end: false },
  { to: '/raporte', key: 'raporte', icon: IconList, end: false, permission: 'reports.view' as const },
] as const

export function Sidebar() {
  const { t } = useTranslation()
  const me = useMe()
  const rooms = useRooms()
  const sync = useSyncStatus()
  const ok = sync.data?.ok !== false
  const permissions = me.data?.permissions ?? []
  const visible = links.filter((link) => !('permission' in link && link.permission) || permissions.includes(link.permission))

  return (
    <>
      <aside className={s.sidebar}>
        <div className={s.brand}>
          <span className={s.mark}>V</span>
          <span className={s.brandText}>
            <span className={s.hotel}>{t('settings.nameValue')}</span>
            <span className={s.meta}>{t('app.hotelMeta', { count: rooms.data?.length ?? 12 })}</span>
          </span>
        </div>
        <nav className={s.nav} aria-label={t('app.title')}>
          {visible.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.key}
                to={link.to}
                end={link.end}
                className={({ isActive }) => clsx(s.link, isActive && s.isActive)}
              >
                <Icon />
                <span>{t(`nav.${link.key}`)}</span>
              </NavLink>
            )
          })}
        </nav>
        <div className={s.footer}>
          <div className={s.sync}>
            <span className={clsx(s.dot, ok ? s.isOk : s.isWarn)} />
            <span>
              <span className={s.syncName}>{t('source.BOOKING')}</span>
              <span className={s.syncState}>{ok ? t('settings.synced') : t('settings.syncProblem')}</span>
            </span>
          </div>
          <NavLink to="/cilesimet" className={({ isActive }) => clsx(s.link, isActive && s.isActive)}>
            <IconSettings />
            <span>{t('nav.cilesimet')}</span>
          </NavLink>
        </div>
      </aside>
      <nav className={s.bottom} aria-label={t('app.title')}>
        {visible.map((link) => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.key}
              to={link.to}
              end={link.end}
              className={({ isActive }) => clsx(s.bottomLink, isActive && s.isActive)}
            >
              <Icon width="22" height="22" />
              <span>{t(`nav.${link.key}`)}</span>
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}
