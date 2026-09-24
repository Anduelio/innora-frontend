import { useHotelSettings } from '@/lib/api/rooms'
import { formatMoney } from '@/lib/format/money'

export function useCurrency(): string {
  const settings = useHotelSettings()
  return settings.data?.currency === 'ALL' ? 'ALL' : 'EUR'
}

export function useMoney(currency?: string | null) {
  const settingsCurrency = useCurrency()
  const code = currency || settingsCurrency
  return (cents: number, override?: string | null) => formatMoney(cents, override || code)
}
