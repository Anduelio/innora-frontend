import { useCallback, useState } from 'react'

export type ThemeChoice = 'light' | 'dark' | 'system'

const KEY = 'devolli-theme'

/** Pamja e çelët është parazgjedhja; e errëta ose "si pajisja" vetëm kur zgjidhen. */
function current(): ThemeChoice {
  try {
    const stored = window.localStorage.getItem(KEY)
    return stored === 'dark' || stored === 'system' ? stored : 'light'
  } catch {
    return 'light'
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeChoice>(current)
  const setTheme = useCallback((next: ThemeChoice) => {
    setThemeState(next)
    const root = document.documentElement
    if (next === 'light') delete root.dataset.theme
    else root.dataset.theme = next
    try {
      if (next === 'light') window.localStorage.removeItem(KEY)
      else window.localStorage.setItem(KEY, next)
    } catch {
      // ruajtja lokale mund të jetë e çaktivizuar
    }
  }, [])
  return { theme, setTheme }
}
