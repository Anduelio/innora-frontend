import clsx from 'clsx'
import { formatMoney } from '@/lib/format/money'
import s from './Money.module.scss'

export function Money({
  cents,
  currency,
  tone,
  strong = false,
  className,
}: {
  cents: number
  currency: string
  tone?: 'success' | 'warning' | 'danger' | 'muted'
  strong?: boolean
  className?: string
}) {
  return <span className={clsx(s.money, tone && s[tone], strong && s.strong, className)}>{formatMoney(cents, currency)}</span>
}
