import { useEffect, useRef } from 'react'
import type { DaySelection } from '@/types/domain'
import { useCalendarStore } from '@/store/calendarStore'

export function useDragSelect(onComplete: (selection: DaySelection) => void) {
  const setSelection = useCalendarStore((state) => state.setSelection)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    const onUp = () => {
      const selection = useCalendarStore.getState().selection
      if (!selection) return
      setSelection(null)
      onCompleteRef.current(selection)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelection(null)
    }
    window.addEventListener('pointerup', onUp)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('keydown', onKey)
    }
  }, [setSelection])

  return {
    begin(roomId: string, dayIndex: number) {
      setSelection({ roomId, a: dayIndex, b: dayIndex })
    },
    extend(roomId: string, dayIndex: number) {
      const selection = useCalendarStore.getState().selection
      if (!selection || selection.roomId !== roomId || selection.b === dayIndex) return
      setSelection({ roomId, a: selection.a, b: dayIndex })
    },
  }
}
