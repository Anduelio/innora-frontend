import { useTranslation } from 'react-i18next'
import { PHONE_PREFIXES } from '@/lib/phone'
import { Dropdown } from '@/components/ui/Dropdown/Dropdown'
import { TextInput } from '@/components/ui/TextInput/TextInput'
import s from './PhoneField.module.scss'

export function PhoneField({
  id,
  prefix,
  phone,
  onPrefixChange,
  onPhoneChange,
}: {
  id: string
  prefix: string
  phone: string
  onPrefixChange: (prefix: string) => void
  onPhoneChange: (phone: string) => void
}) {
  const { t } = useTranslation()

  return (
    <div className={s.row}>
      <div className={s.prefix}>
        <Dropdown
          id={`${id}-prefix`}
          label={t('form.phonePrefix')}
          value={prefix}
          options={PHONE_PREFIXES.map((item) => ({ value: item.prefix, label: t(`phonePrefix.${item.iso}`) }))}
          onChange={onPrefixChange}
        />
      </div>
      <div className={s.number}>
        <TextInput
          id={id}
          value={phone}
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={t('form.phonePlaceholder')}
          onChange={(event) => onPhoneChange(event.target.value)}
        />
      </div>
    </div>
  )
}
