import { act, render, screen } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { useClickOutside } from '@/lib/hooks/useClickOutside'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import { useDisclosure } from '@/lib/hooks/useDisclosure'
import { useRemoteOptions } from '@/lib/hooks/useRemoteOptions'

describe('hooks', () => {
  it('debounces a value', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 200), { initialProps: { value: 'a' } })
    rerender({ value: 'ab' })
    expect(result.current).toBe('a')
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe('ab')
    vi.useRealTimers()
  })

  it('opens and closes', () => {
    const { result } = renderHook(() => useDisclosure())
    act(() => result.current.show())
    expect(result.current.open).toBe(true)
    act(() => result.current.close())
    expect(result.current.open).toBe(false)
  })

  it('calls back when the pointer leaves the node', () => {
    const onOutside = vi.fn()
    function Probe() {
      const ref = { current: document.createElement('div') }
      useClickOutside(ref, onOutside, true)
      return <button type="button">Inside</button>
    }
    render(<Probe />)
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(onOutside).toHaveBeenCalled()
  })

  it('loads the next page of options', async () => {
    const fetchPage = vi.fn(async (_query: string, page: number) => ({
      items: [{ id: String(page), name: `Guest ${page}` }],
      hasMore: page < 2,
    }))
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    function wrap({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={client}>{children}</QueryClientProvider>
    }
    const { result } = renderHook(
      () =>
        useRemoteOptions({
          queryKey: ['guests'],
          fetchPage,
          mapOption: (item) => ({ value: item.id, label: item.name }),
        }),
      { wrapper: wrap },
    )
    await act(async () => {
      await vi.waitFor(() => expect(result.current.options).toEqual([{ value: '1', label: 'Guest 1' }]))
    })
    await act(async () => {
      result.current.loadMore()
      await vi.waitFor(() => expect(result.current.options).toHaveLength(2))
    })
    expect(result.current.hasMore).toBe(false)
  })
})

describe('click target', () => {
  it('does not fire for a click inside', () => {
    const onOutside = vi.fn()
    function Probe() {
      const ref = { current: null as HTMLDivElement | null }
      useClickOutside(ref, onOutside, true)
      return (
        <div ref={ref}>
          <button type="button">Inside</button>
        </div>
      )
    }
    render(<Probe />)
    screen.getByRole('button').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(onOutside).not.toHaveBeenCalled()
  })
})
