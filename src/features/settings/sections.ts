import type { ComponentType } from 'react'
import {
  IconBed,
  IconBooking,
  IconBuilding,
  IconDownload,
  IconSliders,
  IconUsers,
  IconWrench,
  type IconProps,
} from '@/components/atoms/Icon/icons'
import type { Permission } from '@/lib/permissions'

export const SECTIONS = ['hoteli', 'dhomat', 'mirembajtje', 'booking', 'perdoruesit', 'pamja', 'demo'] as const
export type SectionKey = (typeof SECTIONS)[number]

export const SETTINGS_ROOT = '/cilesimet'
export const DEFAULT_SECTION: SectionKey = 'hoteli'
export const DESKTOP_QUERY = '(min-width: 1024px)'
export const WIDE_QUERY = '(min-width: 768px)'

export const sectionIcons: Record<SectionKey, ComponentType<IconProps>> = {
  hoteli: IconBuilding,
  dhomat: IconBed,
  mirembajtje: IconWrench,
  booking: IconBooking,
  perdoruesit: IconUsers,
  pamja: IconSliders,
  demo: IconDownload,
}

export const sectionPermissions: Record<SectionKey, Permission> = {
  hoteli: 'settings.manage',
  dhomat: 'settings.manage',
  mirembajtje: 'settings.manage',
  booking: 'channel.manage',
  perdoruesit: 'users.manage',
  pamja: 'settings.manage',
  demo: 'settings.manage',
}

export const sectionPath = (key: SectionKey) => `${SETTINGS_ROOT}/${key}`

/** Seksioni aktiv sipas rrugës, ose null kur jemi te lista e cilësimeve. */
export function sectionFor(pathname: string): SectionKey | null {
  const slug = pathname.replace(/\/+$/, '').split('/')[2]
  return SECTIONS.find((key) => key === slug) ?? null
}
