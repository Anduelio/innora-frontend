import { useEffect, useRef } from 'react'
import type { ReservationEvent } from '@/types/domain'

/** Dëgjon ndryshimet e rezervimeve nga të dhënat demo që ruhen në shfletues. */
export function useEventSource(_url: string, onEvent: (event: ReservationEvent) => void) {
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    let active = true
    let unsubscribe = () => {}
    void import('@/mocks/db').then(({ subscribe }) => {
      if (!active) return
      unsubscribe = subscribe((event) => onEventRef.current(event))
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])
}
