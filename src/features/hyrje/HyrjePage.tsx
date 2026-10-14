import { useEffect, useId, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { login, useMe } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { loadStoredTokens } from '@/lib/api/tokenStorage'
import { Button } from '@/components/atoms/Button/Button'
import { IconButton } from '@/components/atoms/IconButton/IconButton'
import { IconCalendar, IconCheckCircle, IconEye, IconEyeOff, IconLock, IconUsers, IconWallet } from '@/components/atoms/Icon/icons'
import { TextInput } from '@/components/atoms/TextInput/TextInput'
import { Alert } from '@/components/molecules/Alert/Alert'
import { Field } from '@/components/molecules/Field/Field'
import s from './HyrjePage.module.scss'

const DEMO_ACCOUNTS = [
  { role: 'owner', email: 'ilir@devollihotel.al', password: 'Pronari2026!' },
  { role: 'staff', email: 'arta@devollihotel.al', password: 'Recepsion2026!' },
] as const

const showDemo = true

function safeReturn(path: string | null): string {
  return path && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/hyrje') ? path : '/'
}

export function HyrjePage() {
  const { t } = useTranslation()
  const id = useId()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const me = useMe()
  const qc = useQueryClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const reason = params.get('arsye')
  const returnTo = safeReturn(params.get('kthehu'))

  useEffect(() => {
    document.title = `${t('login.submit')} · ${t('app.title')}`
  }, [t])

  if (me.data && loadStoredTokens()) return <Navigate to={returnTo} replace />

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError(t('auth.required'))
      return
    }
    setPending(true)
    setError('')
    try {
      const user = await login(email, password)
      qc.clear()
      qc.setQueryData(['me'], user)
      void navigate(returnTo, { replace: true })
    } catch (caught) {
      setError(caught instanceof ApiError && caught.message ? caught.message : t('login.failed'))
    } finally {
      setPending(false)
    }
  }

  return (
    <main className={s.page}>
      <section className={s.brandPanel} aria-hidden="true">
        <div className={s.brandTop}>
          <span className={s.mark}>D</span>
          <span className={s.brandName}>{t('app.title')}</span>
        </div>
        <div className={s.pitch}>
          <h2>{t('auth.pitchTitle')}</h2>
          <ul>
            <li>
              <IconCalendar />
              {t('auth.pitchCalendar')}
            </li>
            <li>
              <IconWallet />
              {t('auth.pitchPayments')}
            </li>
            <li>
              <IconUsers />
              {t('auth.pitchRoles')}
            </li>
          </ul>
        </div>
        <p className={s.brandFoot}>{t('auth.pitchFoot')}</p>
      </section>

      <section className={s.formPanel}>
        <form className={s.card} onSubmit={onSubmit} noValidate>
          <div className={s.mobileBrand}>
            <span className={s.mark}>D</span>
            <span className={s.brandName}>{t('app.title')}</span>
          </div>
          <div>
            <h1 className={s.title}>{t('login.title')}</h1>
            <p className={s.subtitle}>{t('auth.subtitle')}</p>
          </div>

          {reason === 'skadoi' ? <Alert tone="info" title={t('auth.expired')} /> : null}
          {reason === 'dalje' ? <Alert tone="success" title={t('auth.loggedOut')} /> : null}
          {error ? <Alert tone="danger" title={error} /> : null}

          <Field label={t('login.email')} htmlFor={`${id}-email`}>
            <TextInput
              id={`${id}-email`}
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              value={email}
              invalid={Boolean(error) && !email.trim()}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field label={t('login.password')} htmlFor={`${id}-password`} hint={t('auth.forgot')}>
            <TextInput
              id={`${id}-password`}
              type={visible ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              invalid={Boolean(error) && !password}
              onChange={(event) => setPassword(event.target.value)}
              end={
                <IconButton
                  label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
                  aria-pressed={visible}
                  onClick={() => setVisible((value) => !value)}
                >
                  {visible ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </IconButton>
              }
            />
          </Field>
          <Button type="submit" size="lg" block loading={pending} icon={<IconLock size={18} />}>
            {t('login.submit')}
          </Button>

          {showDemo ? (
            <div className={s.demo}>
              <p className={s.demoTitle}>{t('auth.demoTitle')}</p>
              <ul className={s.demoList}>
                {DEMO_ACCOUNTS.map((account) => (
                  <li key={account.email}>
                    <span className={s.demoText}>
                      <strong>{t(`users.roles.${account.role}`)}</strong>
                      <span>{account.email}</span>
                      <span>{account.password}</span>
                    </span>
                    <Button
                      variant="secondary"
                      icon={<IconCheckCircle size={16} />}
                      onClick={() => {
                        setEmail(account.email)
                        setPassword(account.password)
                        setError('')
                      }}
                    >
                      {t('auth.useDemo')}
                    </Button>
                  </li>
                ))}
              </ul>
              <p className={s.demoNote}>{t('auth.demoNote')}</p>
            </div>
          ) : null}
        </form>
      </section>
    </main>
  )
}
