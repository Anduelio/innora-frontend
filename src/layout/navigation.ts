import type { ComponentType } from 'react'
import type { IconProps } from '@/components/atoms/Icon/icons'
import { IconCalendar, IconChart, IconHome, IconList, IconSettings, IconWallet } from '@/components/atoms/Icon/icons'
import type { Permission } from '@/lib/permissions'

export type NavKey = 'sot' | 'kalendari' | 'rezervimet' | 'pagesat' | 'raportet' | 'cilesimet'

export interface NavItem {
  key: NavKey
  to: string
  icon: ComponentType<IconProps>
  end: boolean
  /** Shfaqet në shiritin e poshtëm në celular; të tjerat shkojnë te "Më shumë". */
  tab: boolean
  permission: Permission
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'sot', to: '/', icon: IconHome, end: true, tab: true, permission: 'desk.use' },
  { key: 'kalendari', to: '/kalendari', icon: IconCalendar, end: false, tab: true, permission: 'desk.use' },
  { key: 'rezervimet', to: '/rezervimet', icon: IconList, end: false, tab: true, permission: 'desk.use' },
  { key: 'pagesat', to: '/pagesat', icon: IconWallet, end: false, tab: true, permission: 'payments.record' },
  { key: 'raportet', to: '/raportet', icon: IconChart, end: false, tab: false, permission: 'reports.operational' },
  { key: 'cilesimet', to: '/cilesimet', icon: IconSettings, end: false, tab: false, permission: 'settings.manage' },
]

export function navKeyFor(pathname: string): NavKey {
  const match = NAV_ITEMS.find((item) => item.to !== '/' && pathname.startsWith(item.to))
  return match?.key ?? 'sot'
}
