import { useTranslation } from 'react-i18next'
import type { Guest } from '@/types/domain'
import { fmtShkurter } from '@/lib/date/calendar'
import { guestInitials } from '@/lib/format/persons'
import { Avatar } from '@/components/ui/Avatar/Avatar'
import s from './GuestRow.module.scss'

export function GuestRow({ guest, monthsShort }: { guest: Guest; monthsShort: string[] }) {
  const { t } = useTranslation()
  return (
    <li className={s.row}>
      <Avatar initials={guestInitials(guest.name)} />
      <div className={s.body}>
        <div className={s.name}>{guest.name}</div>
        <div className={s.phone}>{guest.phone || t('common.empty')}</div>
      </div>
      <div className={s.meta}>
        <div>{t('common.stay', { count: guest.stays })}</div>
        <div className={s.last}>{fmtShkurter(guest.lastStay, monthsShort)}</div>
      </div>
    </li>
  )
}
