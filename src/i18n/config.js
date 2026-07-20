import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import commonDe from './locales/de/common.json';
import landingDe from './locales/de/landing.json';
import servicesDe from './locales/de/services.json';
import hoshiDe from './locales/de/hoshi.json';
import commonEn from './locales/en/common.json';
import landingEn from './locales/en/landing.json';
import servicesEn from './locales/en/services.json';
import hoshiEn from './locales/en/hoshi.json';
import { defaultLanguage, supportedLanguages } from './languages.js';
import { translationNamespaces } from './namespaces.js';

export { defaultLanguage, supportedLanguages, translationNamespaces };

export const resources = {
  de: {
    common: commonDe,
    landing: landingDe,
    services: servicesDe,
    hoshi: hoshiDe,
  },
  en: {
    common: commonEn,
    landing: landingEn,
    services: servicesEn,
    hoshi: hoshiEn,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLanguage,
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
  if (i18n.language !== normalized) {
    i18n.changeLanguage(normalized);
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = normalized;
  }
  return normalized;
}

export default i18n;
