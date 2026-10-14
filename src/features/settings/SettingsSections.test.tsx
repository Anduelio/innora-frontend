import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router'
import '@/i18n'
import { channelMappings, hotel, reservations, roomTypes, rooms, users } from '@/mocks/data'
import type { SyncStatus } from '@/types/domain'
import { BlocksSection } from './BlocksSection'
import { BookingSection } from './BookingSection'
import { HotelSection } from './HotelSection'
import { RoomsSection } from './RoomsSection'
import { SettingsHome } from './SettingsHome'
import { UsersSection } from './UsersSection'

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

vi.mock('@/lib/api/reservations', () => ({
  useHotelReservations: () => ok(reservations),
}))

vi.mock('@/lib/api/auth', () => ({
  useCurrentUser: () => ({
    user: { ...users[0], permissions: [] },
    can: () => true,
    isLoading: false,
  }),
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

function renderAt(url: string, element: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/cilesimet" element={<SettingsHome />} />
          <Route path="/cilesimet/hoteli" element={<p>Faqja e hotelit</p>} />
          <Route path="/cilesimet/:section" element={element} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Cilësimet (nënfaqe)', () => {
  beforeEach(() => setViewport(1280))

  it('opens the first subpage on desktop because the sidebar lists the rest', () => {
    renderAt('/cilesimet', null)
    expect(screen.getByText('Faqja e hotelit')).toBeInTheDocument()
  })

  it('shows a list of subpages on a phone, each one a link', () => {
    setViewport(390)
    renderAt('/cilesimet', null)
    const list = screen.getByRole('list', { name: 'Seksionet e cilësimeve' })
    expect(within(list).getByRole('link', { name: /Dhomat dhe tipet/ })).toHaveAttribute('href', '/cilesimet/dhomat')
    expect(within(list).getByRole('link', { name: /Booking\.com/ })).toHaveAttribute('href', '/cilesimet/booking')
    expect(within(list).getAllByRole('link')).toHaveLength(7)
  })

  it('lets the owner edit the hotel and only enables saving after a change', async () => {
    const user = userEvent.setup()
    renderAt('/cilesimet/x', <HotelSection />)
    const save = screen.getByRole('button', { name: 'Ruaj ndryshimet' })
    expect(save).toBeDisabled()
    const name = screen.getByLabelText('Emri i hotelit')
    expect(name).toHaveValue(hotel.name)
    await user.clear(name)
    await user.type(name, 'Hotel Devolli')
    expect(save).toBeEnabled()
    expect(screen.getByText('Keni ndryshime të paruajtura')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Anulo ndryshimet' }))
    expect(screen.getByLabelText('Emri i hotelit')).toHaveValue(hotel.name)
  })

  it('warns when the currency changes', async () => {
    const user = userEvent.setup()
    renderAt('/cilesimet/x', <HotelSection />)
    await user.selectOptions(screen.getByLabelText('Monedha kryesore'), 'ALL')
    expect(screen.getByText('Po ndryshoni monedhën kryesore')).toBeInTheDocument()
  })

  it('lists rooms with switches and flags the room under maintenance', () => {
    renderAt('/cilesimet/x', <RoomsSection />)
    const doubles = screen.getByRole('list', { name: 'Dhomat e tipit Dhomë dyshe' })
    const room104 = within(doubles).getByText('Dhoma 104').closest('li')
    expect(room104).toHaveTextContent('Në mirëmbajtje')
    expect(within(doubles).getByRole('switch', { name: 'Dhoma 101 aktive' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Shto dhomë' })).toBeEnabled()
  })

  it('opens the room type form with the saved values', async () => {
    const user = userEvent.setup()
    renderAt('/cilesimet/x', <RoomsSection />)
    await user.click(screen.getByRole('button', { name: 'Ndrysho tipin Dhomë dyshe' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByLabelText('Emri i tipit')).toHaveValue('Dhomë dyshe')
    expect(within(dialog).getByLabelText('Kodi')).toHaveValue('DBL')
  })

  it('lists maintenance blocks with hotel date format and can open the closure form', async () => {
    const user = userEvent.setup()
    renderAt('/cilesimet/x', <BlocksSection />)
    expect(screen.getByText('26.09.2026')).toBeInTheDocument()
    expect(screen.getByText('28.09.2026')).toBeInTheDocument()
    expect(screen.getByText('Riparim i dushit')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Shto mbyllje' })[0]!)
    expect(screen.getByRole('dialog', { name: 'Mbyll një dhomë' })).toBeInTheDocument()
  })

  it('warns before closing a room that has a reservation', async () => {
    const user = userEvent.setup()
    renderAt('/cilesimet/x', <BlocksSection />)
    await user.click(screen.getAllByRole('button', { name: 'Shto mbyllje' })[0]!)
    const dialog = screen.getByRole('dialog')
    await user.selectOptions(within(dialog).getByLabelText('Dhoma'), '101')
    expect(within(dialog).getByText('Dhoma 101 ka rezervim në këto data')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Mbyll dhomën' })).toBeDisabled()
  })

  it('invites the owner to connect Booking.com and never claims it is synced', () => {
    renderAt('/cilesimet/x', <BookingSection />)
    expect(screen.getAllByRole('button', { name: 'Lidh Booking.com' })[0]).toBeEnabled()
    expect(screen.getAllByText('Nuk është lidhur ende').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pa lidhur').length).toBeGreaterThan(0)
    expect(screen.queryByText('Sinkronizuar')).not.toBeInTheDocument()
    for (const select of screen.getAllByRole('combobox')) expect(select).toBeDisabled()
  })

  it('shows users with Albanian role labels', () => {
    renderAt('/cilesimet/x', <UsersSection />)
    expect(screen.getByText('Ilir Devolli')).toBeInTheDocument()
    expect(screen.getAllByText('Pronar').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Recepsion').length).toBeGreaterThan(0)
    expect(screen.getByText('Ju')).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /Rimbursimet/ })).toHaveTextContent('PoJo')
  })
})
