import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button/Button'
import { Field } from '@/components/ui/Field/Field'
import { TextInput } from '@/components/ui/TextInput/TextInput'
import { login, useMe } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import s from './HyrjePage.module.scss'

export function HyrjePage() {
  const { t } = useTranslation()
  const me = useMe()
  const qc = useQueryClient()
  const [email, setEmail] = useState('recepsion@viladea.al')
  const [password, setPassword] = useState('Admin1234.2')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  if (me.data) return <Navigate to="/" replace />

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const user = await login(email.trim(), password)
      qc.setQueryData(['me'], user)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('login.failed'))
    } finally {
      setPending(false)
    }
  }

  return (
    <main className={s.page}>
      <form className={s.card} onSubmit={onSubmit}>
        <p className={s.brand}>{t('app.title')}</p>
        <h1>{t('login.title')}</h1>
        <Field label={t('login.email')} htmlFor="login-email">
          <TextInput
            id="login-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>
        <Field label={t('login.password')} htmlFor="login-password" error={error || undefined}>
          <TextInput
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>
        <Button type="submit" block spaced disabled={pending}>
          {pending ? t('common.loading') : t('login.submit')}
        </Button>
      </form>
    </main>
  )
}
