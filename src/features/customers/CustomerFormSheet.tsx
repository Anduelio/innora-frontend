import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Customer } from '@/types/domain'
import { useCreateCustomer, useUpdateCustomer } from '@/lib/api/customers'
import { formatPhone, splitPhone } from '@/lib/phone'
import { Button } from '@/components/atoms/Button/Button'
import { Textarea } from '@/components/atoms/Textarea/Textarea'
import { TextInput } from '@/components/atoms/TextInput/TextInput'
import { Field } from '@/components/molecules/Field/Field'
import { PhoneField } from '@/components/molecules/PhoneField/PhoneField'
import { Sheet } from '@/components/organisms/Sheet/Sheet'
import { useActionError } from '@/features/reservation/useStayActions'
import s from './CustomerFormSheet.module.scss'
import { notify } from '@/lib/notify'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Shtim ose ndryshim i një klienti me dorë, edhe pa rezervim. */
export function CustomerFormSheet({
  customer,
  onClose,
  onSaved,
}: {
  /** Kur jepet, forma ndryshon këtë klient; ndryshe krijon një të ri. */
  customer?: Customer | null
  onClose: () => void
  onSaved: (customer: Customer) => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const create = useCreateCustomer()
  const update = useUpdateCustomer()
  const onError = useActionError()
  const initialPhone = splitPhone(null, customer?.phone ?? '')
  const [name, setName] = useState(customer?.name ?? '')
  const [prefix, setPrefix] = useState(initialPhone.prefix)
  const [phone, setPhone] = useState(initialPhone.phone)
  const [email, setEmail] = useState(customer?.email ?? '')
  const [notes, setNotes] = useState(customer?.notes ?? '')
  const [submitted, setSubmitted] = useState(false)

  const editing = Boolean(customer?.contactId)
  const digits = phone.replace(/\D/g, '')
  const errors = {
    name: name.trim() ? '' : t('klientet.form.nameRequired'),
    phone: digits && digits.length < 7 ? t('klientet.form.phoneInvalid') : '',
    email: email.trim() && !EMAIL.test(email.trim()) ? t('klientet.form.emailInvalid') : '',
    contact: !digits && !email.trim() ? t('klientet.form.contactRequired') : '',
  }
  const valid = !errors.name && !errors.phone && !errors.email && !errors.contact
  const pending = create.isPending || update.isPending

  const submit = () => {
    setSubmitted(true)
    if (!valid || pending) return
    const input = {
      name: name.trim(),
      phone: formatPhone(prefix, digits),
      email: email.trim() || null,
      notes: notes.trim() || null,
    }
    const done = (saved: Customer) => {
      notify.success(
        t(editing ? 'klientet.form.saved' : 'klientet.form.added', { name: saved.name }),
        t('klientet.form.savedHint'),
      )
      onSaved(saved)
    }
    if (editing && customer?.contactId)
      update.mutate({ contactId: customer.contactId, input }, { onSuccess: done, onError })
    else create.mutate(input, { onSuccess: done, onError })
  }

  return (
    <Sheet
      open
      title={t(editing ? 'klientet.form.editTitle' : 'klientet.form.title')}
      description={t('klientet.form.hint')}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form={`${id}-form`} size="lg" loading={pending}>
            {t(editing ? 'klientet.form.saveChanges' : 'klientet.form.save')}
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
        <Field label={t('klientet.form.name')} htmlFor={`${id}-name`} error={submitted ? errors.name : undefined}>
          <TextInput
            id={`${id}-name`}
            data-autofocus
            autoComplete="off"
            placeholder={t('reservation.form.namePlaceholder')}
            value={name}
            invalid={submitted && Boolean(errors.name)}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field
          label={t('klientet.form.phone')}
          htmlFor={`${id}-phone`}
          error={submitted ? errors.phone || errors.contact : undefined}
        >
          <PhoneField
            id={`${id}-phone`}
            prefix={prefix}
            phone={phone}
            onPrefixChange={setPrefix}
            onPhoneChange={setPhone}
            invalid={submitted && Boolean(errors.phone || errors.contact)}
          />
        </Field>
        <Field
          label={t('klientet.form.email')}
          htmlFor={`${id}-email`}
          optional
          error={submitted ? errors.email : undefined}
        >
          <TextInput
            id={`${id}-email`}
            type="email"
            inputMode="email"
            autoComplete="off"
            value={email}
            invalid={submitted && Boolean(errors.email)}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label={t('klientet.form.notes')} htmlFor={`${id}-notes`} optional hint={t('klientet.form.notesHint')}>
          <Textarea id={`${id}-notes`} rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>
      </form>
    </Sheet>
  )
}
