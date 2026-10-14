import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import '@/i18n'
import { channelMappings, hotel, roomTypes, rooms, users } from '@/mocks/data'
import type { SyncStatus } from '@/types/domain'
import { CilesimetPage } from './CilesimetPage'

const ok = <T,>(data: T) => ({ data, isPending: false, isError: false, refetch: vi.fn() })

const syncStatus: SyncStatus = {
  level: 'problem',
  provider: 'Beds24',
  connected: false,
  lastInboundAt: null,
  lastOutboundAt: null,
  openIssues: [{ id: 1, type: 'mapping_missing', subject: 'Booking.com nuk është lidhur ende' }],
}

vi.mock('@/lib/api/rooms', () => ({
  useHotelSettings: () => ok(hotel),
  useRoomTypes: () => ok(roomTypes),
  useRooms: () => ok(rooms),
}))

vi.mock('@/lib/api/hotel', () => ({
  useSyncStatus: () => ok(syncStatus),
  useChannelMappings: () => ok(channelMappings),
  useUsers: () => ok(users),
}))

vi.mock('@/lib/api/auth', () => ({
  useCurrentUser: () => ({ user: { ...users[0], permissions: [] }, can: () => true, isLoading: false }),
  useSaveUser: () => ({ mutate: vi.fn(), isPending: false }),
}))

function setViewport(width: number) {
  window.matchMedia = (query: string) => {
    const min = Number(/min-width:\s*(\d+)px/.exec(query)?.[1] ?? 0)
    return {
      matches: width >= min,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }
  }
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <CilesimetPage />
    </MemoryRouter>,
  )
}

describe('CilesimetPage', () => {
  beforeEach(() => setViewport(1280))

  it('opens the Booking.com section from the URL and never claims it is synced', () => {
    setViewport(390)
    renderAt('/cilesimet?seksioni=booking')
    expect(screen.getByRole('tab', { name: 'Booking.com' })).toHaveAttribute('aria-selected', 'true')
    const panel = screen.getByRole('tabpanel')
    expect(within(panel).getByRole('button', { name: 'Lidh Booking.com' })).toBeDisabled()
    expect(within(panel).getAllByText('Nuk është lidhur ende').length).toBeGreaterThan(0)
    expect(within(panel).getAllByText('Pa lidhur').length).toBeGreaterThan(0)
    expect(within(panel).queryByText('Sinkronizuar')).not.toBeInTheDocument()
  })

  it('falls back to the hotel section and switches sections from the desktop nav', async () => {
    const user = userEvent.setup()
    renderAt('/cilesimet?seksioni=panjohur')
    const nav = screen.getByRole('navigation', { name: 'Seksionet e cilësimeve' })
    expect(within(nav).getByRole('button', { name: 'Hoteli' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByText(hotel.name)).toBeInTheDocument()

    await user.click(within(nav).getByRole('button', { name: 'Dhomat dhe tipet' }))
    expect(within(nav).getByRole('button', { name: 'Dhomat dhe tipet' })).toHaveAttribute('aria-current', 'true')
    const doubles = screen.getByRole('list', { name: 'Dhomat e tipit Dhomë dyshe' })
    const room104 = within(doubles).getByText('104').closest('li')
    expect(room104).toHaveTextContent('Në mirëmbajtje')
  })

  it('lists maintenance blocks with hotel date format', () => {
    renderAt('/cilesimet?seksioni=mirembajtje')
    expect(screen.getByText('26.09.2026')).toBeInTheDocument()
    expect(screen.getByText('28.09.2026')).toBeInTheDocument()
    expect(screen.getByText('Riparim i dushit')).toBeInTheDocument()
  })

  it('shows users with Albanian role labels', () => {
    renderAt('/cilesimet?seksioni=perdoruesit')
    expect(screen.getByText('Ilir Devolli')).toBeInTheDocument()
    expect(screen.getAllByText('Pronar').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Recepsion').length).toBeGreaterThan(0)
    expect(screen.getByText('Ju')).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /Rimbursimet/ })).toHaveTextContent('PoJo')
  })
})
