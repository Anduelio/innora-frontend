import { useEffect, useRef } from 'react'
import type { ReservationEvent } from '@/types/domain'
import { loadStoredTokens } from '@/lib/api/tokenStorage'

export function useEventSource(url: string, onEvent: (event: ReservationEvent) => void) {
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    const token = loadStoredTokens()?.access_token
    const streamUrl = token ? `${url}?access_token=${encodeURIComponent(token)}` : url
    const source = new EventSource(streamUrl)
    source.onerror = () => source.close()
    source.onmessage = (message) => {
      try {
        onEventRef.current(JSON.parse(message.data) as ReservationEvent)
      } catch {
        // mesazh i paplotë
      }
    }
    return () => source.close()
  }, [url])
}
