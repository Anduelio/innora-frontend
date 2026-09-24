import { useTranslation } from 'react-i18next'
import { formatPhone } from '@/lib/phone'
import type { Guest } from '@/types/domain'
import { fmtShkurter } from '@/lib/date/calendar'
import { guestInitials } from '@/lib/format/persons'
import { Avatar } from '@/components/ui/Avatar/Avatar'
import s from './GuestRow.module.scss'

export function GuestRow({ guest, monthsShort, showPhone = true }: { guest: Guest; monthsShort: string[]; showPhone?: boolean }) {
  const { t } = useTranslation()
  return (
    <li className={s.row}>
      <Avatar initials={guestInitials(guest.name)} />
      <div className={s.body}>
        <div className={s.name}>{guest.name}</div>
        {showPhone ? <div className={s.phone}>{formatPhone(guest.phonePrefix, guest.phone) || t('common.empty')}</div> : null}
      </div>
      <div className={s.meta}>
        <div>{t('common.stay', { count: guest.stays })}</div>
        <div className={s.last}>{fmtShkurter(guest.lastStay, monthsShort)}</div>
      </div>
    </li>
  )
}
