import { forwardRef, type InputHTMLAttributes } from 'react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { IconClose, IconSearch } from '@/components/atoms/Icon/icons'
import s from './SearchInput.module.scss'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  label: string
  value: string
  onValueChange: (value: string) => void
}

export const SearchInput = forwardRef<HTMLInputElement, Props>(function SearchInput(
  { label, value, onValueChange, className, placeholder, ...props },
  ref,
) {
  const { t } = useTranslation()
  return (
    <div className={clsx(s.wrap, className)}>
      <IconSearch className={s.icon} size={18} />
      <input
        ref={ref}
        type="search"
        className={s.input}
        aria-label={label}
        placeholder={placeholder ?? label}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        {...props}
      />
      {value ? (
        <button type="button" className={s.clear} aria-label={t('common.clear')} onClick={() => onValueChange('')}>
          <IconClose size={16} />
        </button>
      ) : null}
    </div>
  )
})
