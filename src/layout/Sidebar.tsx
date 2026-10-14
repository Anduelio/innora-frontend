import { NavLink } from 'react-router'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/atoms/Avatar/Avatar'
import { IconLogout, IconSidebar } from '@/components/atoms/Icon/icons'
import { useCurrentUser } from '@/lib/api/auth'
import { useHotelSettings, useRooms } from '@/lib/api/rooms'
import { NAV_ITEMS } from '@/layout/navigation'
import { useLogout } from '@/layout/useLogout'
import s from './Sidebar.module.scss'

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { t } = useTranslation()
  const rooms = useRooms()
  const hotel = useHotelSettings()
  const { user, can } = useCurrentUser()
  const logout = useLogout()

  return (
    <aside className={clsx(s.sidebar, collapsed && s.collapsed)} data-print-hide>
      <div className={s.brand}>
        <span className={s.mark} aria-hidden="true">
          D
        </span>
        <span className={s.brandText}>
          <span className={s.hotel}>{hotel.data?.name ?? t('app.title')}</span>
          <span className={s.meta}>
            {t('app.hotelMeta', { city: hotel.data?.city ?? '', count: rooms.data?.length ?? 0 })}
          </span>
        </span>
      </div>
      <nav className={s.nav} aria-label={t('nav.main')}>
        {NAV_ITEMS.filter((item) => can(item.permission)).map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.key}
              to={item.to}
              end={item.end}
              title={collapsed ? t(`nav.${item.key}`) : undefined}
              className={({ isActive }) => clsx(s.link, isActive && s.isActive)}
            >
              <Icon />
              <span className={s.linkText}>{t(`nav.${item.key}`)}</span>
            </NavLink>
          )
        })}
      </nav>
      <div className={s.footer}>
        {user ? (
          <div className={s.user} title={`${user.name} · ${user.email}`}>
            <Avatar name={user.name} size="sm" />
            <span className={s.userText}>
              <span className={s.userName}>{user.name}</span>
              <span className={s.meta}>{t(`users.roles.${user.role}`)}</span>
            </span>
          </div>
        ) : null}
        <button type="button" className={s.toggle} aria-label={t('auth.logout')} title={t('auth.logout')} onClick={() => void logout()}>
          <IconLogout size={18} />
        </button>
        <button
          type="button"
          className={clsx(s.toggle, s.collapseToggle)}
          aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
          title={collapsed ? t('nav.expand') : t('nav.collapse')}
          aria-pressed={collapsed}
          onClick={onToggle}
        >
          <IconSidebar size={18} />
        </button>
      </div>
    </aside>
  )
}
