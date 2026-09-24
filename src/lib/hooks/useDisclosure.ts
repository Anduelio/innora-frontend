import { useCallback, useState } from 'react'

export function useDisclosure(initial = false) {
  const [open, setOpen] = useState(initial)
  const toggle = useCallback(() => setOpen((current) => !current), [])
  const close = useCallback(() => setOpen(false), [])
  const show = useCallback(() => setOpen(true), [])
  return { open, setOpen, toggle, close, show }
}
