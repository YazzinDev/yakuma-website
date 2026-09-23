import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { siteUrl } from '../src/config/site.js';
import { hoshiStoreLinks } from '../src/config/storeLinks.js';
import { hoshiMediaLinks } from '../src/config/mediaLinks.js';
import { hoshiSocialLinks, yakumaSocialLinks } from '../src/config/socialLinks.js';
import { supportedLanguages } from '../src/i18n/languages.js';
import { translationNamespaces } from '../src/i18n/namespaces.js';
import { buildStaticRoutes, legalDocuments, neutralRouteAliases } from '../src/routes/localizedPaths.js';
import { buildIndexableRoutes, getLegalEntries } from './route-indexing.mjs';
import './verify-scrollspy.mjs';
import './verify-yakuma-faq.mjs';
import './verify-contact-footer.mjs';
import './verify-legal-revisions.mjs';
import './verify-legal-model.mjs';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const failures = [];
const routes = buildStaticRoutes();
const routeSet = new Set(['/', ...routes]);
const siteOrigin = new URL(siteUrl).origin;
const legalEntries = getLegalEntries(root);
const aliases = new Set(neutralRouteAliases.map(alias => alias.path));
const assert = (condition, message) => { if (!condition) failures.push(message); };
const read = path => readFileSync(path, 'utf8');
const fileFor = route => resolve(dist, route === '/' ? 'index.html' : `${route.slice(1)}.html`);
const cleanFor = route => resolve(dist, route.slice(1), 'index.html');
const count = (value, pattern) => [...value.matchAll(pattern)].length;

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : [path];
  });
}

function readRoute(route) {
  const path = fileFor(route);
  assert(existsSync(path), `Missing route ${route}`);
  return existsSync(path) ? read(path) : '';
}

function checkInternalTargets(route, html) {
  for (const [, attribute, href] of html.matchAll(/\s(href|src|poster)=["']([^"']+)["']/gi)) {
    if (!href || href.startsWith('#') || /^(mailto:|tel:|data:|blob:)/i.test(href)) continue;
    let target;
    try { target = new URL(href, `${siteUrl}${route === '/' ? '/' : `${route}/`}`); }
    catch { failures.push(`Invalid ${attribute} target in ${route}: ${href}`); continue; }
    if (target.origin !== siteOrigin) continue;
    const pathname = target.pathname.replace(/\/$/, '') || '/';
    const asset = resolve(dist, pathname.slice(1));
    assert(routeSet.has(pathname) || existsSync(asset) || existsSync(`${asset}.html`) || existsSync(resolve(asset, 'index.html')),
      `Broken internal ${attribute} target in ${route}: ${href}`);
  }
  for (const [tag] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)) {
    const rel = /\brel="([^"]+)"/.exec(tag)?.[1]?.split(/\s+/) ?? [];
    assert(rel.includes('noopener') && rel.includes('noreferrer'), `Unsafe blank-target link in ${route}`);
  }
}

function checkJsonLd(route, html) {
  for (const [, source] of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)) {
    try {
      const schema = JSON.parse(source.replaceAll('&quot;', '"').replaceAll('&amp;', '&'));
      const nodes = schema['@graph'] ?? [schema];
      for (const node of nodes) {
        assert(Boolean(node['@type']), `JSON-LD node without type in ${route}`);
        for (const key of ['@id', 'url', 'image', 'logo']) {
          if (typeof node[key] === 'string') assert(/^https?:\/\//.test(node[key]), `Non-absolute JSON-LD ${key} in ${route}`);
        }
      }
      if (route === '/de' || route === '/en' || route.endsWith('/games/hoshi')) {
        const faq = nodes.find(node => node['@type'] === 'FAQPage');
        assert(faq?.mainEntity?.length === 5, `FAQPage schema must contain five localized questions in ${route}`);
      }
    } catch (error) { failures.push(`Invalid JSON-LD in ${route}: ${error.message}`); }
  }
}

function checkLayers() {
  const banned = { atoms: ['molecules', 'organisms', 'pages'], molecules: ['organisms', 'pages'] };
  for (const [layer, forbidden] of Object.entries(banned)) {
    for (const file of filesIn(resolve(root, 'src/components', layer))) {
      const source = read(file);
      for (const [, specifier] of source.matchAll(/^\s*import\s+(?:[^'";]+\s+from\s+)?['"]([^'"]+)['"]/gm)) {
        if (!specifier.startsWith('.')) continue;
        const target = resolve(dirname(file), specifier).replaceAll('\\', '/');
        assert(!forbidden.some(name => target.includes(`/src/components/${name}/`) || target.includes('/src/pages/')),
          `Atomic layer violation: ${file} imports ${specifier}`);
      }
    }
  }
  const shell = read(resolve(root, 'src/layouts/PageShell.jsx'));
  for (const name of ['SkipLink', 'SiteHeader', 'SiteFooter']) assert(shell.includes(name), `PageShell missing ${name}`);
  for (const file of filesIn(resolve(root, 'src/pages')).filter(file => file.endsWith('.jsx'))) {
    if (/RedirectToLocale|RedirectUnsupportedLanguage/.test(file)) continue;
    assert(read(file).includes('../layouts/PageShell'), `Routed page bypasses PageShell: ${file}`);
  }
}

function checkLocales() {
  const flatten = (value, prefix = '') => value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => flatten(child, `${prefix}.${key}`)) : [prefix];
  for (const namespace of translationNamespaces) {
    const [first, ...others] = supportedLanguages;
    const reference = new Set(flatten(JSON.parse(read(resolve(root, `src/i18n/locales/${first}/${namespace}.json`)))));
    for (const language of others) {
      const actual = new Set(flatten(JSON.parse(read(resolve(root, `src/i18n/locales/${language}/${namespace}.json`)))));
      assert(reference.size === actual.size && [...reference].every(key => actual.has(key)),
        `Locale keys differ in ${namespace}: ${first}/${language}`);
    }
  }
}

function checkConfig() {
  for (const [name, config, keys] of [
    ['store', hoshiStoreLinks, ['appStore', 'googlePlay']],
    ['trailer', hoshiMediaLinks, ['trailer']],
    ['hoshi socials', hoshiSocialLinks, ['instagram', 'reddit', 'linkedin']],
    ['yakuma socials', yakumaSocialLinks, ['linkedin']],
  ]) {
    assert(Object.keys(config).sort().join(',') === keys.sort().join(','), `${name} config keys differ`);
    for (const [key, value] of Object.entries(config)) {
      assert(value === null || /^https:\/\/\S+$/.test(value), `${name}.${key} must be null or HTTPS`);
    }
  }
  const fonts = read(resolve(root, 'src/styles/fonts.css'));
  for (const family of ['Anton', 'Inter', 'IBM Plex Mono', 'Gontserrat']) assert(fonts.includes(family), `Missing local ${family} font`);
  assert(!/fonts\.(googleapis|gstatic)\.com/.test(fonts + read(resolve(root, 'index.html'))), 'Remote Google Fonts dependency');
  for (const [, asset] of fonts.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)) {
    assert(existsSync(resolve(root, 'src/styles', asset)), `Missing local font file ${asset}`);
  }
}

assert(new Set(routes).size === routes.length, 'Duplicate static route');
for (const route of routes) {
  const main = fileFor(route);
  const mirror = cleanFor(route);
  assert(existsSync(main) && existsSync(mirror), `Missing route or clean URL mirror: ${route}`);
  if (existsSync(main) && existsSync(mirror)) assert(read(main) === read(mirror), `Clean URL mirror differs: ${route}`);
}
const expectedHtml = new Set([fileFor('/'), resolve(dist, '404.html'), ...routes.flatMap(route => [fileFor(route), cleanFor(route)])].map(path => path.toLowerCase()));
const actualHtml = filesIn(dist).filter(path => path.endsWith('.html')).map(path => path.toLowerCase());
assert(actualHtml.length === expectedHtml.size && actualHtml.every(path => expectedHtml.has(path)), 'Rendered HTML inventory differs from static routes');

checkLayers();
checkLocales();
checkConfig();

const rootHtml = readRoute('/');
assert(rootHtml.includes('window.location.replace') && rootHtml.includes('noindex, follow'), 'Root locale redirect contract missing');
for (const { path, target } of neutralRouteAliases) {
  const html = readRoute(path);
  assert(html.includes(`url=${target}`) && html.includes('window.location.replace'), `Neutral alias redirect is broken: ${path}`);
}
for (const route of routes) {
  const html = readRoute(route);
  assert(!/<link[^>]+rel="modulepreload"[^>]+heroGlobeScene-/.test(html), `Globe renderer should wait for visible Hero in ${route}`);
  for (const [link] of html.matchAll(/<link\b[^>]*>/g)) {
    if (!/rel="preload"/.test(link) || !/as="image"/.test(link)) continue;
    const hoshiHeroRoute = /^\/(?:de|en)\/games\/hoshi(?:\/download)?$/.test(route);
    if (hoshiHeroRoute && /\/assets\/EraVR-[^"/]+\.webp/.test(link)) {
      assert(/fetchpriority="high"/.test(link), `Hoshi Hero preload should have high priority in ${route}`);
      continue;
    }
    assert(/\/assets\/globe-first-frame-(?:desktop|mobile)-[^"/]+\.png/.test(link), `Below-fold image preloaded in ${route}: ${link}`);
    assert(/fetchpriority="high"/.test(link), `Globe image preload should have high priority in ${route}`);
    const expectedMedia = /\/assets\/globe-first-frame-mobile-/.test(link) ? '(max-width: 1100px)' : '(min-width: 1101px)';
    assert(link.includes(`media="${expectedMedia}"`), `Globe image preload has wrong viewport media in ${route}`);
  }
  if (!aliases.has(route)) {
    for (const needle of ['class="skip-link"', '<header class="site-header', 'id="main-content"', '<footer class="site-footer', 'id="site-mobile-navigation"', 'class="language-switcher"']) {
      assert(html.includes(needle), `Shared shell missing ${needle} in ${route}`);
    }
    assert(count(html, /<footer class="site-footer/g) === 1, `Expected one footer in ${route}`);
    assert(count(html, /<title\b/g) === 1, `Expected one title in ${route}`);
    assert(html.includes(`rel="canonical" href="${siteUrl}${route}"`), `Canonical missing in ${route}`);
  }
  assert(!/href="\/hoshi(?:\/|\b)/.test(html), `Legacy Hoshi URL in ${route}`);
  checkInternalTargets(route, html);
  checkJsonLd(route, html);
}

for (const language of supportedLanguages) {
  const home = readRoute(`/${language}`);
  for (const id of ['hero', 'about', 'projects', 'faq', 'contact']) assert(home.includes(`id="${id}"`), `Yakuma ${language} missing ${id}`);
  assert(home.includes(`href="/${language}/games/hoshi"`), `Hoshi project route missing in ${language} homepage`);
  const hoshi = readRoute(`/${language}/games/hoshi`);
  const hoshiHeroPreload = /<link\b[^>]*href="(\/assets\/EraVR-[^"/]+\.webp)"[^>]*rel="preload"[^>]*>/;
  assert(hoshiHeroPreload.test(hoshi), `Hoshi ${language} Hero image preload missing`);
  assert(/class="hoshi-hero__phone"[^>]+fetchpriority="high"[^>]+height="781"[^>]+width="481"/.test(hoshi), `Hoshi ${language} Hero image priority or dimensions missing`);
  for (const id of ['hero', 'about', 'gameplay', 'faq', 'download']) assert(hoshi.includes(`id="${id}"`), `Hoshi ${language} missing ${id}`);
  const slideGallery = hoshi.split('class="hoshi-how-to__gallery"')[1]?.split('</div>')[0] ?? '';
  assert(count(slideGallery, /<img\b/g) === 5, `Hoshi ${language} requires five original gameplay slides`);
  assert(count(hoshi, /<details class="faq-item/g) === 5, `Hoshi ${language} requires five FAQ items`);
  const download = readRoute(`/${language}/games/hoshi/download`);
  assert(hoshiHeroPreload.test(download), `Hoshi ${language} download Hero image preload missing`);
  assert(download.includes('hoshi-hero--download') && !download.includes('Downloads are being prepared'), `Download hero mismatch for ${language}`);
  const deletePage = readRoute(`/${language}/games/hoshi/delete-account`);
  assert(deletePage.includes('hoshi-delete__steps') && deletePage.includes('mailto:'), `Delete-account instructions missing for ${language}`);
  const privacy = readRoute(`/${language}/games/hoshi/legal/privacy-policy`);
  assert(privacy.includes('legal-document__table-wrapper') && privacy.includes('<table>'), `Hoshi ${language} privacy table missing`);
  assert(!home.includes(`/${language}/services/`), `Removed service links remain in ${language} homepage`);
}

const expectedLegalCount = supportedLanguages.length * Object.values(legalDocuments).reduce((sum, types) => sum + types.length, 0);
assert(legalEntries.length === expectedLegalCount, 'Legal registry entry count differs');
for (const entry of legalEntries) {
  const html = readRoute(entry.route);
  assert(entry.markdown.trim().length > 0, `Empty legal document: ${entry.route}`);
  assert(html.includes('name="robots" content="noindex, nofollow"') === entry.pending, `Legal indexing mismatch: ${entry.route}`);
  assert(html.includes('class="legal-closing"'), `Legal section closing missing: ${entry.route}`);
}

const indexable = buildIndexableRoutes(root).map(route => `${siteUrl}${route}`);
for (const file of ['public/sitemap.xml', 'dist/sitemap.xml']) {
  const xml = read(resolve(root, file));
  const actual = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
  assert(actual.length === indexable.length && actual.every(url => indexable.includes(url)), `Sitemap URLs differ: ${file}`);
  assert(xml.includes('hreflang="x-default"'), `Sitemap missing x-default: ${file}`);
}
for (const file of ['public/robots.txt', 'dist/robots.txt']) {
  const content = read(resolve(root, file));
  assert(content.includes('User-agent: *') && content.includes(`Sitemap: ${siteUrl}/sitemap.xml`), `Robots contract missing: ${file}`);
}
for (const file of ['public/_headers', 'dist/_headers']) {
  const content = read(resolve(root, file));
  for (const header of [
    'X-Content-Type-Options: nosniff',
    'Referrer-Policy: strict-origin-when-cross-origin',
    'X-Frame-Options: DENY',
    'Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()',
    'Cache-Control: public, max-age=31536000, immutable',
  ]) {
    assert(content.includes(header), `Security header ${header} missing in ${file}`);
  }
}
for (const file of ['public/site.webmanifest', 'dist/site.webmanifest']) {
  const manifest = JSON.parse(read(resolve(root, file)));
  assert(manifest.name === 'Yakuma' && manifest.scope === '/' && manifest.start_url === '/de', `Web manifest mismatch: ${file}`);
}
for (const file of ['public/CNAME', 'dist/CNAME']) {
  assert(read(resolve(root, file)).trim() === new URL(siteUrl).hostname, `CNAME mismatch: ${file}`);
}
for (const file of ['public/.nojekyll', 'dist/.nojekyll']) assert(existsSync(resolve(root, file)), `Missing ${file}`);
assert(readRoute('/404') === readRoute('/de/404'), 'Static host 404 differs from German 404');

if (failures.length) {
  console.error(`Current build verification failed with ${failures.length} issue(s):`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Current build verification passed for ${routes.length} static routes, legal documents and localized pages.`);
}
