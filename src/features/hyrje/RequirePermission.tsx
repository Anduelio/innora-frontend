import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/lib/api/auth'
import type { Permission } from '@/lib/permissions'
import { Button } from '@/components/atoms/Button/Button'
import { IconLock } from '@/components/atoms/Icon/icons'
import { EmptyState } from '@/components/molecules/EmptyState/EmptyState'

export function RequirePermission({ permission, children }: { permission: Permission; children: ReactNode }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { can } = useCurrentUser()
  if (can(permission)) return children
  return (
    <EmptyState
      icon={<IconLock />}
      title={t('auth.noAccess')}
      description={t('auth.noAccessHint')}
      action={<Button onClick={() => void navigate('/')}>{t('auth.backToToday')}</Button>}
    />
  )
}
