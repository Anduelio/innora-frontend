import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { StaffUser } from '@/types/domain'
import { useCurrentUser } from '@/lib/api/auth'
import { useUsers } from '@/lib/api/hotel'
import { fmtDate } from '@/lib/date/calendar'
import { ROLE_PERMISSIONS, type Permission } from '@/lib/permissions'
import { Avatar } from '@/components/atoms/Avatar/Avatar'
import { Badge } from '@/components/atoms/Badge/Badge'
import { Button } from '@/components/atoms/Button/Button'
import {
  IconCheck,
  IconCheckCircle,
  IconCircle,
  IconClose,
  IconHome,
  IconPlus,
  IconUser,
  IconUsers,
} from '@/components/atoms/Icon/icons'
import { Card } from '@/components/molecules/Card/Card'
import { EmptyState } from '@/components/molecules/EmptyState/EmptyState'
import { SectionShell } from './SectionShell'
import { SectionError, SectionLoading } from './SectionStates'
import { UserSheet } from './UserSheet'
import s from './Users.module.scss'

const SHOWN: Permission[] = [
  'desk.use',
  'reservations.manage',
  'payments.record',
  'reports.operational',
  'payments.refund',
  'reports.financial',
  'settings.manage',
  'channel.manage',
  'users.manage',
]

function lastLogin(iso: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  const day = date.toLocaleDateString('sv-SE', { timeZone: 'Europe/Tirane' })
  const time = date.toLocaleTimeString('sq-AL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Tirane',
  })
  return `${fmtDate(day)} · ${time}`
}

function UserRow({ user, isSelf, onEdit }: { user: StaffUser; isSelf: boolean; onEdit: () => void }) {
  const { t } = useTranslation()
  const seen = lastLogin(user.lastLoginAt)
  return (
    <li className={s.user}>
      <Avatar name={user.name} />
      <div className={s.identity}>
        <p className={s.name}>
          {user.name}
          {isSelf ? <span className={s.you}>{t('cilesimet.users.you')}</span> : null}
        </p>
        <p className={s.email}>{user.email}</p>
        <p className={s.email}>
          {seen ? t('cilesimet.users.lastLogin', { when: seen }) : t('cilesimet.users.neverLoggedIn')}
        </p>
      </div>
      <div className={s.badges}>
        <Badge
          tone={user.role === 'owner' ? 'info' : 'neutral'}
          icon={user.role === 'owner' ? <IconHome size={16} /> : <IconUser size={16} />}
        >
          {t(`users.roles.${user.role}`)}
        </Badge>
        {user.isActive ? (
          <Badge tone="success" icon={<IconCheckCircle size={16} />}>
            {t('cilesimet.users.active')}
          </Badge>
        ) : (
          <Badge tone="neutral" icon={<IconCircle size={16} />}>
            {t('cilesimet.users.inactive')}
          </Badge>
        )}
      </div>
      <Button variant="secondary" onClick={onEdit}>
        {t('common.edit')}
      </Button>
    </li>
  )
}

function PermissionsCard() {
  const { t } = useTranslation()
  return (
    <Card title={t('cilesimet.users.permissionsTitle')} description={t('cilesimet.users.permissionsHint')} flush>
      <div className={s.tableWrap}>
        <table className={s.matrix}>
          <thead>
            <tr>
              <th scope="col">{t('cilesimet.users.permissionCol')}</th>
              <th scope="col">{t('users.roles.owner')}</th>
              <th scope="col">{t('users.roles.staff')}</th>
            </tr>
          </thead>
          <tbody>
            {SHOWN.map((permission) => (
              <tr key={permission}>
                <th scope="row">{t(`cilesimet.users.permissions.${permission.replace('.', '_')}`)}</th>
                {(['owner', 'staff'] as const).map((role) => {
                  const allowed = ROLE_PERMISSIONS[role].includes(permission)
                  return (
                    <td key={role} className={allowed ? s.allowed : s.denied}>
                      <span className={s.verdict}>
                        {allowed ? <IconCheck size={18} /> : <IconClose size={18} />}
                        {allowed ? t('cilesimet.users.yes') : t('cilesimet.users.no')}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function UsersSection() {
  const { t } = useTranslation()
  const users = useUsers()
  const { user: me } = useCurrentUser()
  const [editing, setEditing] = useState<StaffUser | 'new' | null>(null)
  const title = t('cilesimet.sections.perdoruesit')

  if (users.isPending)
    return (
      <SectionShell section="perdoruesit">
        <SectionLoading title={title} />
      </SectionShell>
    )
  if (users.isError) {
    return (
      <SectionShell section="perdoruesit">
        <SectionError title={title} onRetry={() => void users.refetch()} />
      </SectionShell>
    )
  }

  return (
    <SectionShell section="perdoruesit">
      <Card
        title={t('cilesimet.users.listTitle')}
        description={t('cilesimet.users.description')}
        icon={<IconUsers />}
        actions={
          <Button icon={<IconPlus />} onClick={() => setEditing('new')}>
            {t('cilesimet.users.add')}
          </Button>
        }
        flush
      >
        {users.data.length === 0 ? (
          <EmptyState title={t('cilesimet.users.empty')} icon={<IconUsers />} compact />
        ) : (
          <ul className={s.users}>
            {users.data.map((user) => (
              <UserRow key={user.id} user={user} isSelf={user.id === me?.id} onEdit={() => setEditing(user)} />
            ))}
          </ul>
        )}
      </Card>
      <PermissionsCard />
      {editing ? (
        <UserSheet
          key={editing === 'new' ? 'new' : editing.id}
          user={editing === 'new' ? null : editing}
          isSelf={editing !== 'new' && editing.id === me?.id}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </SectionShell>
  )
}
