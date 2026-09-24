import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMe } from '@/lib/api/auth'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const me = useMe()

  if (me.isLoading) {
    return (
      <p role="status" style={{ padding: 'var(--s-6)' }}>
        {t('common.loading')}
      </p>
    )
  }

  if (me.isError || !me.data) return <Navigate to="/hyrje" replace />

  return children
}
