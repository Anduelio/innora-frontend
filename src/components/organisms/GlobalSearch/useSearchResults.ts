import { useMemo, type ComponentType } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { IconProps } from '@/components/atoms/Icon/icons'
import { IconBed, IconPlus, IconUser } from '@/components/atoms/Icon/icons'
import type { Reservation } from '@/types/domain'
import { useCurrentUser } from '@/lib/api/auth'
import { useCustomers } from '@/lib/api/customers'
import { useHotelReservations } from '@/lib/api/reservations'
import { useRooms } from '@/lib/api/rooms'
import { addDaysIso, fmtDayMonth } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { matchCustomer } from '@/lib/customers'
import { isActiveStay, matchReservation } from '@/lib/reservation'
import { matchesText, titleRank } from '@/lib/search'
import { NAV_ITEMS } from '@/layout/navigation'
import { SECTIONS, sectionIcons, sectionPath, sectionPermissions } from '@/features/settings/sections'
import { useUiStore } from '@/store/uiStore'

export type ResultGroup = 'pages' | 'actions' | 'reservations' | 'customers' | 'rooms'

export interface SearchResult {
  id: string
  group: ResultGroup
  title: string
  meta?: string
  icon?: ComponentType<IconProps>
  /** Emri për avatar kur rezultati është person. */
  person?: string
  reservation?: Reservation
  run: () => void
}

export const GROUP_ORDER: ResultGroup[] = ['actions', 'pages', 'reservations', 'customers', 'rooms']
const LIMITS: Record<ResultGroup, number> = { actions: 3, pages: 7, reservations: 5, customers: 4, rooms: 4 }

function rank(item: Reservation): number {
  if (item.status === 'IN_HOUSE') return 0
  if (isActiveStay(item) && item.checkIn >= TODAY) return 1
  return 2
}

/**
 * Gjithë kërkimi i kokës: faqet dhe nën-faqet, veprimet e shpejta, rezervimet, klientët dhe dhomat.
 * Pa kërkim kthen vetëm faqet dhe veprimet, që menyja të shërbejë si shkurtore për gjithçka.
 */
export function useSearchResults(query: string, onDone: () => void): SearchResult[] {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { can } = useCurrentUser()
  const openCreate = useUiStore((state) => state.openCreate)
  const openDrawer = useUiStore((state) => state.openDrawer)
  const reservations = useHotelReservations()
  const customers = useCustomers()
  const rooms = useRooms()
  const needle = query.trim()

  return useMemo(() => {
    const go = (to: string) => () => {
      navigate(to)
      onDone()
    }
    const keywords = (key: string) => t(`search.keywords.${key}`, { defaultValue: '' })

    const actions: SearchResult[] = [
      {
        id: 'action:new-reservation',
        group: 'actions',
        title: t('common.newReservation'),
        meta: t('search.actions.newReservationMeta'),
        icon: IconPlus,
        run: () => {
          openCreate({ checkIn: TODAY, checkOut: addDaysIso(TODAY, 1) })
          onDone()
        },
      },
      {
        id: 'action:new-customer',
        group: 'actions',
        title: t('klientet.form.new'),
        meta: t('search.actions.newCustomerMeta'),
        icon: IconUser,
        run: go('/klientet?i-ri=1'),
      },
    ]

    const pages: SearchResult[] = [
      ...NAV_ITEMS.filter((item) => can(item.permission)).map((item) => ({
        id: `page:${item.key}`,
        group: 'pages' as const,
        title: t(`nav.${item.key}`),
        meta: item.key === 'sot' ? t('search.sotMeta') : t(`pages.${item.key}`),
        icon: item.icon,
        run: go(item.to),
        words: `${t(`nav.${item.key}`)} ${keywords(item.key)}`,
      })),
      ...SECTIONS.filter((key) => can(sectionPermissions[key])).map((key) => ({
        id: `page:cilesimet:${key}`,
        group: 'pages' as const,
        title: t(`cilesimet.sections.${key}`),
        meta: t('nav.cilesimet'),
        icon: sectionIcons[key],
        run: go(sectionPath(key)),
        words: `${t(`cilesimet.sections.${key}`)} ${t('nav.cilesimet')} ${keywords(key)}`,
      })),
    ]

    const strip = (item: SearchResult & { words?: string }): SearchResult => {
      const result = { ...item }
      delete result.words
      return result
    }

    if (!needle) return [...actions, ...pages.map(strip)]

    const pick = <T extends SearchResult & { words?: string }>(list: T[], group: ResultGroup) =>
      list
        .filter((item) => matchesText(item.words ?? `${item.title} ${item.meta ?? ''}`, needle))
        .sort((a, b) => titleRank(a.title, needle) - titleRank(b.title, needle))
        .slice(0, LIMITS[group])
        .map(strip)

    const reservationResults: SearchResult[] = (reservations.data ?? [])
      .filter((item) => matchReservation(item, needle))
      .sort((a, b) => rank(a) - rank(b) || a.checkIn.localeCompare(b.checkIn))
      .slice(0, LIMITS.reservations)
      .map((item) => ({
        id: `reservation:${item.id}`,
        group: 'reservations' as const,
        title: item.guestName,
        meta: `${fmtDayMonth(item.checkIn)} → ${fmtDayMonth(item.checkOut)} · ${
          item.roomId ? t('common.roomNumber', { room: item.roomId }) : t('room.unassigned')
        } · ${item.code}`,
        person: item.guestName,
        reservation: item,
        run: () => {
          openDrawer(item.id)
          onDone()
        },
      }))

    const customerResults: SearchResult[] = (customers.data ?? [])
      .filter((item) => matchCustomer(item, needle))
      .slice(0, LIMITS.customers)
      .map((item) => ({
        id: `customer:${item.id}`,
        group: 'customers' as const,
        title: item.name,
        meta: [item.phone, item.email].filter(Boolean).join(' · ') || t('search.noContact'),
        person: item.name,
        run: go(`/klientet?klienti=${encodeURIComponent(item.id)}`),
      }))

    const roomTarget = can('settings.manage') ? sectionPath('dhomat') : '/kalendari'
    const roomResults = pick(
      (rooms.data ?? []).map((room) => ({
        id: `room:${room.id}`,
        group: 'rooms' as const,
        title: t('common.roomNumber', { room: room.id }),
        meta: [
          room.type,
          room.floor ? t('search.floor', { floor: room.floor }) : '',
          t('search.capacity', { count: room.capacity }),
        ]
          .filter(Boolean)
          .join(' · '),
        icon: IconBed,
        run: go(roomTarget),
        words: `${room.id} ${t('common.roomNumber', { room: room.id })} ${room.type} ${room.floor ?? ''}`,
      })),
      'rooms',
    )

    return [
      ...pick(actions, 'actions'),
      ...pick(pages, 'pages'),
      ...reservationResults,
      ...customerResults,
      ...roomResults,
    ]
  }, [needle, t, navigate, can, onDone, openCreate, openDrawer, reservations.data, customers.data, rooms.data])
}
