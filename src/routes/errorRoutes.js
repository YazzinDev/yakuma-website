import { defaultLanguage, supportedLanguages } from '../i18n/languages.js';

/** Resolve branding from path segments, including neutral and unsupported locales. */
export function getErrorRoute(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  const language = supportedLanguages.includes(parts[0]) ? parts[0] : defaultLanguage;
  const hoshi = /^(?:\/(?:[^/]+))?\/games\/hoshi(?:\/|$)/.test(pathname)
    || /^(?:\/(?:de|en))?\/hoshi(?:\/|$)/.test(pathname);
  return `/${language}${hoshi ? '/games/hoshi' : ''}/404`;
}
