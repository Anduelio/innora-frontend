import { useEffect, type RefObject } from 'react'

export function useClickOutside(ref: RefObject<HTMLElement | null>, onOutside: () => void, active = true) {
  useEffect(() => {
    if (!active) return
    const onPointer = (event: PointerEvent) => {
      const node = ref.current
      if (!node || node.contains(event.target as Node)) return
      onOutside()
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [active, onOutside, ref])
}
