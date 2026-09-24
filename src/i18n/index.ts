import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import sq from './sq.json'

void i18n.use(initReactI18next).init({
  resources: { sq: { translation: sq } },
  lng: 'sq',
  fallbackLng: 'sq',
  interpolation: { escapeValue: false },
  returnObjects: true,
})

export { i18n }
