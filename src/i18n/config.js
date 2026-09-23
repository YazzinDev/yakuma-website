import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import commonDe from './locales/de/common.json';
import landingDe from './locales/de/landing.json';
import hoshiDe from './locales/de/hoshi.json';
import commonEn from './locales/en/common.json';
import landingEn from './locales/en/landing.json';
import hoshiEn from './locales/en/hoshi.json';
import { defaultLanguage, supportedLanguages } from './languages.js';
import { translationNamespaces } from './namespaces.js';

export { defaultLanguage, supportedLanguages, translationNamespaces };

export const resources = {
  de: {
    common: commonDe,
    landing: landingDe,
    hoshi: hoshiDe,
  },
  en: {
    common: commonEn,
    landing: landingEn,
    hoshi: hoshiEn,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: typeof window === 'undefined' ? defaultLanguage : normalizeLanguage(window.location.pathname.split('/')[1]),
  fallbackLng: defaultLanguage,
  ns: translationNamespaces,
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export function normalizeLanguage(language) {
  return supportedLanguages.includes(language) ? language : defaultLanguage;
}

export function setDocumentLanguage(language) {
  const normalized = normalizeLanguage(language);
  if (typeof window === 'undefined' && i18n.language !== normalized) {
    i18n.changeLanguage(normalized);
  }
  return normalized;
}

export default i18n;
