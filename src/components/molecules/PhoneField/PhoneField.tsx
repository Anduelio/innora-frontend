import { useTranslation } from 'react-i18next'
import { PHONE_PREFIXES } from '@/lib/phone'
import { Select } from '@/components/atoms/Select/Select'
import { TextInput } from '@/components/atoms/TextInput/TextInput'
import s from './PhoneField.module.scss'

export function PhoneField({
  id,
  prefix,
  phone,
  onPrefixChange,
  onPhoneChange,
  invalid = false,
}: {
  id: string
  prefix: string
  phone: string
  onPrefixChange: (prefix: string) => void
  onPhoneChange: (phone: string) => void
  invalid?: boolean
}) {
  const { t } = useTranslation()

  return (
    <div className={s.row}>
      <Select
        className={s.prefix}
        aria-label={t('phone.prefix')}
        value={prefix}
        onChange={(event) => onPrefixChange(event.target.value)}
      >
        {PHONE_PREFIXES.map((item) => (
          <option key={item.iso} value={item.prefix}>
            {item.prefix} · {t(`phone.countries.${item.iso}`)}
          </option>
        ))}
      </Select>
      <TextInput
        id={id}
        className={s.number}
        value={phone}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        invalid={invalid}
        placeholder={t('phone.placeholder')}
        onChange={(event) => onPhoneChange(event.target.value)}
      />
    </div>
  )
}
