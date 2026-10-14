import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { StaffUser, UserRole } from '@/types/domain'
import { useSaveUser } from '@/lib/api/auth'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/atoms/Button/Button'
import { IconHome, IconRefresh, IconUser } from '@/components/atoms/Icon/icons'
import { Switch } from '@/components/atoms/Switch/Switch'
import { TextInput } from '@/components/atoms/TextInput/TextInput'
import { Field } from '@/components/molecules/Field/Field'
import { SegmentedControl } from '@/components/molecules/SegmentedControl/SegmentedControl'
import { Sheet } from '@/components/organisms/Sheet/Sheet'
import { useActionError } from '@/features/rezervimi/useStayActions'
import s from './Users.module.scss'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const WORDS = ['Devoll', 'Korce', 'Liqen', 'Mali', 'Pishe', 'Dielli']

function suggestPassword(): string {
  const random = crypto.getRandomValues(new Uint32Array(2))
  const word = WORDS[(random[0] ?? 0) % WORDS.length] ?? 'Devoll'
  return `${word}-${String((random[1] ?? 0) % 9000 + 1000)}!`
}

export function UserSheet({ user, isSelf, onClose }: { user: StaffUser | null; isSelf: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const id = useId()
  const save = useSaveUser()
  const showToast = useUiStore((state) => state.showToast)
  const onError = useActionError()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [role, setRole] = useState<UserRole>(user?.role ?? 'staff')
  const [active, setActive] = useState(user?.isActive ?? true)
  const [password, setPassword] = useState(user ? '' : suggestPassword())
  const [submitted, setSubmitted] = useState(false)

  const errors = {
    name: name.trim() ? '' : t('cilesimet.users.form.nameRequired'),
    email: user || EMAIL.test(email.trim()) ? '' : t('cilesimet.users.form.emailInvalid'),
    password: (!user || password) && password.length < 8 ? t('cilesimet.users.form.passwordWeak') : '',
  }
  const valid = !errors.name && !errors.email && !errors.password

  const submit = () => {
    setSubmitted(true)
    if (!valid) return
    save.mutate(
      {
        id: user?.id,
        input: user
          ? { name: name.trim(), role, isActive: active, ...(password ? { password } : {}) }
          : { name: name.trim(), email: email.trim(), role, password },
      },
      {
        onSuccess: (saved) => {
          showToast(user ? [t('cilesimet.users.form.saved', { name: saved.name })] : [t('cilesimet.users.form.created', { name: saved.name }), t('cilesimet.users.form.shareHint')])
          onClose()
        },
        onError,
      },
    )
  }

  return (
    <Sheet
      open
      title={user ? t('cilesimet.users.form.editTitle', { name: user.name }) : t('cilesimet.users.form.newTitle')}
      description={user ? user.email : t('cilesimet.users.form.newHint')}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form={`${id}-form`} loading={save.isPending}>
            {user ? t('common.save') : t('cilesimet.users.form.create')}
          </Button>
        </>
      }
    >
      <form
        id={`${id}-form`}
        className={s.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <Field label={t('cilesimet.users.form.name')} htmlFor={`${id}-name`} error={submitted ? errors.name : undefined}>
          <TextInput id={`${id}-name`} data-autofocus autoComplete="off" value={name} invalid={submitted && Boolean(errors.name)} onChange={(event) => setName(event.target.value)} />
        </Field>
        {user ? null : (
          <Field label={t('login.email')} htmlFor={`${id}-email`} error={submitted ? errors.email : undefined} hint={t('cilesimet.users.form.emailHint')}>
            <TextInput
              id={`${id}-email`}
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoComplete="off"
              value={email}
              invalid={submitted && Boolean(errors.email)}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
        )}
        <Field label={t('cilesimet.users.form.role')} hint={isSelf ? t('cilesimet.users.form.selfRole') : t(`cilesimet.users.form.roleHint.${role}`)}>
          {isSelf ? (
            <p className={s.lockedValue}>{t(`users.roles.${role}`)}</p>
          ) : (
            <SegmentedControl<UserRole>
              label={t('cilesimet.users.form.role')}
              value={role}
              onChange={setRole}
              block
              options={[
                { value: 'staff', label: t('users.roles.staff'), icon: <IconUser /> },
                { value: 'owner', label: t('users.roles.owner'), icon: <IconHome /> },
              ]}
            />
          )}
        </Field>
        {user && !isSelf ? (
          <div className={s.switchRow}>
            <span>
              <strong>{t('cilesimet.users.form.active')}</strong>
              <span>{t('cilesimet.users.form.activeHint')}</span>
            </span>
            <Switch label={t('cilesimet.users.form.active')} checked={active} onChange={setActive} />
          </div>
        ) : null}
        <Field
          label={user ? t('cilesimet.users.form.newPassword') : t('cilesimet.users.form.tempPassword')}
          htmlFor={`${id}-password`}
          optional={Boolean(user)}
          error={submitted ? errors.password : undefined}
          hint={user ? t('cilesimet.users.form.newPasswordHint') : t('cilesimet.users.form.tempPasswordHint')}
          aside={
            <button type="button" className={s.suggest} onClick={() => setPassword(suggestPassword())}>
              <IconRefresh size={14} />
              {t('cilesimet.users.form.suggest')}
            </button>
          }
        >
          <TextInput
            id={`${id}-password`}
            autoComplete="new-password"
            value={password}
            invalid={submitted && Boolean(errors.password)}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
      </form>
    </Sheet>
  )
}
