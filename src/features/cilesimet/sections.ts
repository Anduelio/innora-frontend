import type { ComponentType } from 'react'
import { IconBed, IconBooking, IconMonitor, IconSettings, IconUsers, IconWrench, type IconProps } from '@/components/atoms/Icon/icons'

export const SECTIONS = ['hoteli', 'dhomat', 'mirembajtje', 'booking', 'perdoruesit', 'pamja'] as const
export type SectionKey = (typeof SECTIONS)[number]

export const DEFAULT_SECTION: SectionKey = 'hoteli'
export const SECTION_PARAM = 'seksioni'
export const DESKTOP_QUERY = '(min-width: 1024px)'
export const WIDE_QUERY = '(min-width: 768px)'

export const sectionIcons: Record<SectionKey, ComponentType<IconProps>> = {
  hoteli: IconSettings,
  dhomat: IconBed,
  mirembajtje: IconWrench,
  booking: IconBooking,
  perdoruesit: IconUsers,
  pamja: IconMonitor,
}

const sectionSet = new Set<string>(SECTIONS)

export function toSection(value: string | null): SectionKey {
  return value && sectionSet.has(value) ? (value as SectionKey) : DEFAULT_SECTION
}
