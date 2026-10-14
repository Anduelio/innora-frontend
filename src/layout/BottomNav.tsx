import { useCallback, useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/atoms/Avatar/Avatar'
import { Button } from '@/components/atoms/Button/Button'
import { IconChevronRight, IconDots, IconLogout } from '@/components/atoms/Icon/icons'
import { Sheet } from '@/components/organisms/Sheet/Sheet'
import { useCurrentUser } from '@/lib/api/auth'
import { NAV_ITEMS, navKeyFor } from '@/layout/navigation'
import { useLogout } from '@/layout/useLogout'
import s from './BottomNav.module.scss'

export function BottomNav() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { user, can } = useCurrentUser()
  const logout = useLogout()
  const [more, setMore] = useState(false)
  const close = useCallback(() => setMore(false), [])
  const current = navKeyFor(pathname)
  const allowed = NAV_ITEMS.filter((item) => can(item.permission))
  const extra = allowed.filter((item) => !item.tab)
  const moreActive = extra.some((item) => item.key === current)

  return (
    <>
      <nav className={s.bar} aria-label={t('nav.main')} data-print-hide>
        {allowed
          .filter((item) => item.tab)
          .map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.key}
                to={item.to}
                end={item.end}
                className={({ isActive }) => clsx(s.tab, isActive && s.isActive)}
              >
                <Icon size={22} />
                <span>{t(`nav.${item.key}`)}</span>
              </NavLink>
            )
          })}
        <button
          type="button"
          className={clsx(s.tab, moreActive && s.isActive)}
          aria-haspopup="dialog"
          aria-expanded={more}
          onClick={() => setMore(true)}
        >
          <IconDots size={22} />
          <span>{t('nav.more')}</span>
        </button>
      </nav>
      <Sheet open={more} title={t('nav.more')} onClose={close} mobile="bottom">
        {user ? (
          <div className={s.user}>
            <Avatar name={user.name} />
            <span className={s.userText}>
              <strong>{user.name}</strong>
              <span>
                {t(`users.roles.${user.role}`)} · {user.email}
              </span>
            </span>
          </div>
        ) : null}
        <ul className={s.list}>
          {extra.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.key}>
                <NavLink to={item.to} className={s.item} onClick={close}>
                  <Icon />
                  <span>{t(`nav.${item.key}`)}</span>
                  <IconChevronRight size={18} className={s.chevron} />
                </NavLink>
              </li>
            )
          })}
        </ul>
        <Button variant="secondary" block icon={<IconLogout />} onClick={() => void logout()}>
          {t('auth.logout')}
        </Button>
      </Sheet>
    </>
  )
}
