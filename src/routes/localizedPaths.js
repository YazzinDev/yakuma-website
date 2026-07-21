import { supportedLanguages } from '../i18n/languages.js';

export { supportedLanguages };

export const serviceIds = [
  'software-engineering',
  'game-design',
  'interactive-product-design',
];

export const legalDocuments = {
  yakuma: ['legal-disclosure', 'privacy-policy'],
  hoshi: ['legal-disclosure', 'privacy-policy', 'terms-of-service'],
};

// GitHub Pages can only serve static files, so neutral public URLs resolve to
// the documented English fallback through generated meta-refresh pages.
export const neutralRouteAliases = [
  { path: '/games', target: '/en/games/hoshi' },
  { path: '/games/hoshi', target: '/en/games/hoshi' },
  { path: '/games/hoshi/download', target: '/en/games/hoshi/download' },
  { path: '/games/hoshi/delete-account', target: '/en/games/hoshi/delete-account' },
  { path: '/games/hoshi/legal/legal-disclosure', target: '/en/games/hoshi/legal/legal-disclosure' },
  { path: '/games/hoshi/legal/privacy-policy', target: '/en/games/hoshi/legal/privacy-policy' },
  { path: '/games/hoshi/legal/terms-of-service', target: '/en/games/hoshi/legal/terms-of-service' },
];

export function withLanguage(language, path = '') {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (cleanPath.startsWith('/#')) return `/${language}${cleanPath.slice(1)}`;
  return `/${language}${cleanPath === '/' ? '' : cleanPath}`;
}

export function localizedHref(language, href) {
  if (!href || href === '#') return href;
  if (href.startsWith('#')) return href;
  if (supportedLanguages.some((lang) => href === `/${lang}` || href.startsWith(`/${lang}/`))) {
    return href;
  }
  return withLanguage(language, href);
}

function getAlternateLanguageResolution(pathname, targetLanguage) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return { exact: true, path: `/${targetLanguage}` };
  if (supportedLanguages.includes(parts[0])) {
    parts[0] = targetLanguage;
    const candidatePath = `/${parts.join('/')}`;
    const exact = buildStaticRoutes().includes(candidatePath);
    return { exact, path: exact ? candidatePath : `/${targetLanguage}` };
  }
  return { exact: false, path: `/${targetLanguage}` };
}

export function getAlternateLanguagePath(pathname, targetLanguage) {
  return getAlternateLanguageResolution(pathname, targetLanguage).path;
}

export function getAlternateLanguageHref(location, targetLanguage) {
  const { exact, path } = getAlternateLanguageResolution(location.pathname, targetLanguage);
  return exact ? `${path}${location.search}${location.hash}` : path;
}

export function buildLocalizedStaticRoutes() {
  return supportedLanguages.flatMap((language) => [
    `/${language}`,
    ...serviceIds.map((serviceId) => `/${language}/services/${serviceId}`),
    `/${language}/games/hoshi`,
    `/${language}/games/hoshi/download`,
    `/${language}/games/hoshi/delete-account`,
    `/${language}/games/hoshi/news/the-first-boards`,
    `/${language}/404`,
    ...legalDocuments.yakuma.map((docType) => `/${language}/legal/${docType}`),
    ...legalDocuments.hoshi.map((docType) => `/${language}/games/hoshi/legal/${docType}`),
  ]);
}

export function buildStaticRoutes() {
  return [...buildLocalizedStaticRoutes(), ...neutralRouteAliases.map(({ path }) => path)];
}
