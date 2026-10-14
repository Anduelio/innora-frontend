import { useEffect, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Toaster as Sonner } from 'sonner'
import { IconAlert, IconCheckCircle, IconClose, IconInfo, IconXCircle } from '@/components/atoms/Icon/icons'
import s from './Toaster.module.scss'

type Resolved = 'light' | 'dark'

/** Pamja që po shfaqet: ndjek zgjedhjen e faqes (`data-theme`) dhe, për "si pajisja", cilësimin e sistemit. */
function readTheme(): Resolved {
  const choice = document.documentElement.dataset.theme
  if (choice === 'dark') return 'dark'
  if (choice === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  return 'light'
}

function useResolvedTheme(): Resolved {
  const [theme, setTheme] = useState<Resolved>(readTheme)
  useEffect(() => {
    const update = () => setTheme(readTheme())
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', update)
    return () => {
      observer.disconnect()
      media.removeEventListener('change', update)
    }
  }, [])
  return theme
}

/** Ngjyrat vijnë nga tokenat e temës; sfondi i tonit shtrohet mbi sipërfaqen që njoftimi të mos jetë transparent. */
const solid = (tone: string) => `linear-gradient(var(--tone-${tone}-bg), var(--tone-${tone}-bg)), var(--bg-surface)`
const palette = (name: string, tone: string) => ({
  [`--${name}-bg`]: solid(tone),
  [`--${name}-border`]: `var(--tone-${tone}-line)`,
  [`--${name}-text`]: `var(--tone-${tone}-fg)`,
})

const style = {
  '--normal-bg': 'var(--bg-surface)',
  '--normal-border': 'var(--border-default)',
  '--normal-text': 'var(--fg-default)',
  '--border-radius': 'var(--radius-lg)',
  '--width': '420px',
  ...palette('success', 'success'),
  ...palette('error', 'danger'),
  ...palette('warning', 'warning'),
  ...palette('info', 'info'),
  zIndex: 'var(--z-toast)',
} as CSSProperties

const iconProps = { size: 22 }

/** Njoftimet e aplikacionit: lart djathtas, me temë të çelët ose të errët. */
export function Toaster() {
  const { t } = useTranslation()
  const theme = useResolvedTheme()

  return (
    <Sonner
      position="top-right"
      theme={theme}
      richColors
      closeButton
      expand
      visibleToasts={4}
      gap={12}
      offset={{ top: 'calc(var(--topbar-h) + 12px)', right: 20 }}
      mobileOffset={{ top: 12, left: 12, right: 12 }}
      containerAriaLabel={t('toast.notifications')}
      style={style}
      icons={{
        success: <IconCheckCircle {...iconProps} />,
        error: <IconXCircle {...iconProps} />,
        warning: <IconAlert {...iconProps} />,
        info: <IconInfo {...iconProps} />,
        close: <IconClose size={16} />,
      }}
      toastOptions={{
        classNames: {
          toast: s.toast,
          title: s.title,
          description: s.description,
          icon: s.icon,
          actionButton: s.action,
          closeButton: s.close,
        },
      }}
    />
  )
}
