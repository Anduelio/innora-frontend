import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { changePassword } from '@/lib/api/auth'
import { errorText } from '@/lib/api/client'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/ui/Button/Button'
import { Field } from '@/components/ui/Field/Field'
import { TextInput } from '@/components/ui/TextInput/TextInput'
import s from './CilesimetPage.module.scss'

export function PasswordSettingsCard() {
  const { t } = useTranslation()
  const showToast = useUiStore((state) => state.showToast)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async () => {
    setPending(true)
    try {
      await changePassword(currentPassword, newPassword, confirm)
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
      showToast([t('settings.passwordSaved')])
    } catch (error) {
      showToast([errorText(error, t('toast.failed'))])
    } finally {
      setPending(false)
    }
  }

  return (
    <section className={s.card}>
      <h2>{t('settings.password')}</h2>
      <Field label={t('settings.currentPassword')} htmlFor="current-password">
        <TextInput
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
      </Field>
      <Field label={t('settings.newPassword')} htmlFor="new-password">
        <TextInput
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
      </Field>
      <Field label={t('settings.confirmPassword')} htmlFor="confirm-password">
        <TextInput
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
      </Field>
      <Button spaced onClick={submit} disabled={pending}>
        {t('settings.savePassword')}
      </Button>
    </section>
  )
}
