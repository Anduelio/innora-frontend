import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

type Bundle = Record<string, unknown>

/** Çdo ekran ka skedarin e vet në ./sq; çelësat e nivelit të parë nuk duhet të përsëriten midis skedarëve. */
const files = import.meta.glob<Bundle>('./sq/*.json', { eager: true, import: 'default' })
const translation = Object.values(files).reduce<Bundle>((all, bundle) => ({ ...all, ...bundle }), {})

void i18n.use(initReactI18next).init({
  resources: { sq: { translation } },
  lng: 'sq',
  fallbackLng: 'sq',
  interpolation: { escapeValue: false },
  returnObjects: true,
})

export { i18n }
