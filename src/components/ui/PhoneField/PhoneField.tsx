import { useTranslation } from 'react-i18next'
import { PHONE_PREFIXES } from '@/lib/phone'
import { Select } from '@/components/ui/Select/Select'
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
        <Select
          id={`${id}-prefix`}
          aria-label={t('form.phonePrefix')}
          value={prefix}
          onChange={(event) => onPrefixChange(event.target.value)}
        >
          {PHONE_PREFIXES.map((item) => (
            <option key={item.iso} value={item.prefix}>
              {t(`phonePrefix.${item.iso}`)}
            </option>
          ))}
        </Select>
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
