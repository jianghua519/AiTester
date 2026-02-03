import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Import translations
import en from './locales/en.json'
import zh from './locales/zh.json'
import ja from './locales/ja.json'

// Initialize i18next
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
    ja: { translation: ja },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
