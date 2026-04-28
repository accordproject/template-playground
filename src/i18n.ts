import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import frTranslation from './locales/fr/translation.json';
import esTranslation from './locales/es/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      fr: { translation: frTranslation },
      es: { translation: esTranslation },
    },
    supportedLngs: ['en', 'fr', 'es'],
    load: 'languageOnly',
    fallbackLng: 'en',
    // Initialize synchronously to prevent components from suspending
    // while i18n resolves — avoids app spinner hanging in E2E tests.
    initImmediate: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  }).catch((err) => {
    console.error("I18N INIT ERROR:", err);
  });

export default i18n;
