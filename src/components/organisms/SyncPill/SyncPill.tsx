import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { IconAlert, IconCheckCircle, IconClock } from '@/components/atoms/Icon/icons'
import { useSyncStatus } from '@/lib/api/hotel'
import { useClickOutside } from '@/lib/hooks/useClickOutside'
import s from './SyncPill.module.scss'

const icons = { pending: IconClock, synced: IconCheckCircle, problem: IconAlert }

function timeOf(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Tirane' })
}

export function SyncPill({ compact = false, canManage }: { compact?: boolean; canManage: boolean }) {
  const { t } = useTranslation()
  const sync = useSyncStatus()
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useClickOutside(wrap, close, open)

  const status = sync.data
  const level = status?.level ?? 'pending'
  const Icon = icons[level]

  return (
    <div className={s.wrap} ref={wrap}>
      <button
        type="button"
        className={clsx(s.pill, s[level], compact && s.compact)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`${t('sync.title')}: ${t(`sync.${level}`)}`}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon size={16} />
        <span className={s.text}>{t(`sync.${level}`)}</span>
      </button>
      {open ? (
        <div className={s.panel} role="dialog" aria-label={t('sync.title')}>
          <p className={s.panelTitle}>
            <Icon size={18} />
            {t(`sync.${level}`)}
          </p>
          <p className={s.detail}>{status?.connected ? t('sync.connectedDetail') : t('sync.notConnectedDetail')}</p>
          <dl className={s.facts}>
            <div>
              <dt>{t('sync.provider')}</dt>
              <dd>{status?.provider ?? '—'}</dd>
            </div>
            <div>
              <dt>{t('sync.lastIn')}</dt>
              <dd>{timeOf(status?.lastInboundAt ?? null)}</dd>
            </div>
            <div>
              <dt>{t('sync.lastOut')}</dt>
              <dd>{timeOf(status?.lastOutboundAt ?? null)}</dd>
            </div>
          </dl>
          {status?.openIssues.length ? (
            <ul className={s.issues}>
              {status.openIssues.map((issue) => (
                <li key={issue.id}>{issue.subject}</li>
              ))}
            </ul>
          ) : null}
          {canManage ? (
            <Link className={s.link} to="/cilesimet?seksioni=booking" onClick={close}>
              {t('sync.openSettings')}
            </Link>
          ) : (
            <p className={s.detail}>{t('sync.tellOwner')}</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
