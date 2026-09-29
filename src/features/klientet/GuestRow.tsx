import clsx from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { formatPhone } from '@/lib/phone'
import type { Guest } from '@/types/domain'
import { fmtShkurter } from '@/lib/date/calendar'
import { guestInitials } from '@/lib/format/persons'
import { Avatar } from '@/components/ui/Avatar/Avatar'
import s from './GuestRow.module.scss'

export function GuestRow({
  guest,
  monthsShort,
  showPhone = true,
  editing = false,
  actions,
}: {
  guest: Guest
  monthsShort: string[]
  showPhone?: boolean
  editing?: boolean
  actions?: ReactNode
}) {
  const { t } = useTranslation()
  const phone = formatPhone(guest.phonePrefix, guest.phone)
  return (
    <tr className={clsx(s.row, editing && s.editing)}>
      <td>
        <div className={s.who}>
          <Avatar initials={guestInitials(guest.name)} />
          <div className={s.name}>{guest.name}</div>
        </div>
      </td>
      {showPhone ? <td className={s.phone}>{phone || t('common.empty')}</td> : null}
      <td className={s.meta}>{t('common.stay', { count: guest.stays })}</td>
      <td className={s.meta}>{guest.lastStay ? fmtShkurter(guest.lastStay, monthsShort) : t('common.empty')}</td>
      <td className={s.actions}>{actions}</td>
    </tr>
  )
}
