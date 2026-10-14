import { useCallback, useState } from 'react'

const PREFIX = 'devolli:v1:'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

/** Gjendje e vogël e ndërfaqes që mbahet midis hapjeve (p.sh. menuja e ngushtuar). */
export function usePersistentState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => read(key, fallback))
  const update = useCallback(
    (next: T) => {
      setValue(next)
      try {
        window.localStorage.setItem(PREFIX + key, JSON.stringify(next))
      } catch {
        // ruajtja lokale mund të jetë e çaktivizuar
      }
    },
    [key],
  )
  return [value, update] as const
}
