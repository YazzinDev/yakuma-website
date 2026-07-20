import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteUrl } from '../src/config/site.js';
import { defaultLanguage, supportedLanguages } from '../src/i18n/languages.js';
import { getAlternateLanguagePath } from '../src/routes/localizedPaths.js';
import { buildIndexableRoutes } from './route-indexing.mjs';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sitemapPath = resolve(rootDir, 'public', 'sitemap.xml');
const indexableRoutes = buildIndexableRoutes(rootDir);
const indexableRouteSet = new Set(indexableRoutes);

function buildAlternateLinks(route) {
  const languageLinks = supportedLanguages
    .map((language) => ({
      language,
      path: getAlternateLanguagePath(route, language),
    }))
    .filter(({ path }) => indexableRouteSet.has(path));

  if (languageLinks.length < 2) return '';

  const xDefaultPath = getAlternateLanguagePath(route, defaultLanguage);
  const links = indexableRouteSet.has(xDefaultPath)
    ? [...languageLinks, { language: 'x-default', path: xDefaultPath }]
    : languageLinks;

  return links
    .map(({ language, path }) => `    <xhtml:link rel="alternate" hreflang="${language}" href="${siteUrl}${path}" />`)
    .join('\n');
}

const urls = indexableRoutes
  .map((route) => {
    const alternateLinks = buildAlternateLinks(route);
    const alternateBlock = alternateLinks ? `\n${alternateLinks}` : '';

    return `  <url>
    <loc>${siteUrl}${route}</loc>${alternateBlock}
  </url>`;
  })
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;

await mkdir(dirname(sitemapPath), { recursive: true });
await writeFile(sitemapPath, sitemap, 'utf8');
