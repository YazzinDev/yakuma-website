import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { hoshiMediaLinks } from '../src/config/mediaLinks.js';
import { siteUrl } from '../src/config/site.js';
import { hoshiSocialLinks, yakumaSocialLinks } from '../src/config/socialLinks.js';
import { hoshiStoreLinks } from '../src/config/storeLinks.js';
import { translationNamespaces } from '../src/i18n/namespaces.js';
import { defaultLanguage } from '../src/i18n/languages.js';
import { parseLegalMarkdown } from '../src/legal/markdown.js';
import {
  buildStaticRoutes,
  getAlternateLanguageHref,
  getAlternateLanguagePath,
  legalDocuments,
  localizedHref,
  neutralRouteAliases,
  serviceIds,
  supportedLanguages,
} from '../src/routes/localizedPaths.js';
import { buildIndexableRoutes, getLegalEntries } from './route-indexing.mjs';

const rootDir = resolve(import.meta.dirname, '..');
const distDir = resolve(rootDir, 'dist');

const failures = [];

function distPath(route) {
  if (route === '/') return resolve(distDir, 'index.html');
  const cleanRoute = route.replace(/^\//, '');
  return resolve(distDir, `${cleanRoute}.html`);
}

function cleanUrlIndexPath(route) {
  const cleanRoute = route.replace(/^\//, '');
  return resolve(distDir, cleanRoute, 'index.html');
}

function readDist(route) {
  const path = distPath(route);
  if (!existsSync(path)) {
    failures.push(`Missing rendered route file for ${route}: ${path}`);
    return '';
  }
  return readFileSync(path, 'utf8');
}

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function assertContains(text, needle, message) {
  assert(text.includes(needle), message);
}

function flattenJsonKeys(value, prefix = '') {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => flattenJsonKeys(entry, `${prefix}[${index}]`));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, entry]) =>
      flattenJsonKeys(entry, prefix ? `${prefix}.${key}` : key),
    );
  }

  return [prefix];
}

function assertAppearsInOrder(text, needles, message) {
  let previousIndex = -1;
  for (const needle of needles) {
    const index = text.indexOf(needle, previousIndex + 1);
    if (index <= previousIndex) {
      failures.push(message);
      return;
    }
    previousIndex = index;
  }
}

function decodeHtml(text) {
  return text
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function extractJsonLd(html, route) {
  const scripts = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)];

  return scripts.flatMap((match) => {
    try {
      return [JSON.parse(decodeHtml(match[1]))];
    } catch (error) {
      failures.push(`Invalid JSON-LD in ${route}: ${error.message}`);
      return [];
    }
  });
}

function schemaNodes(data) {
  return data.flatMap((entry) => (Array.isArray(entry['@graph']) ? entry['@graph'] : [entry]));
}

function assertSchemaType(html, route, type) {
  const nodes = schemaNodes(extractJsonLd(html, route));
  assert(nodes.some((node) => node['@type'] === type), `Missing ${type} JSON-LD schema in ${route}.`);
  return nodes;
}

function assertFaqSchema(nodes, route, expectedQuestionCount) {
  const faqNode = nodes.find((node) => node['@type'] === 'FAQPage');
  assert(Boolean(faqNode), `Missing FAQPage JSON-LD schema in ${route}.`);
  assert(
    faqNode?.mainEntity?.length === expectedQuestionCount,
    `FAQPage schema in ${route} should contain ${expectedQuestionCount} questions.`,
  );
  assert(
    faqNode?.mainEntity?.every(
      (question) =>
        question['@type'] === 'Question' &&
        Boolean(question.name) &&
        question.acceptedAnswer?.['@type'] === 'Answer' &&
        Boolean(question.acceptedAnswer?.text),
    ),
    `FAQPage schema in ${route} has malformed question entries.`,
  );
}

function assertSchemaUrlsAreAbsolute(value, route, path = 'schema') {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertSchemaUrlsAreAbsolute(entry, route, `${path}[${index}]`));
    return;
  }

  if (!value || typeof value !== 'object') return;

  for (const [key, entry] of Object.entries(value)) {
    const nextPath = `${path}.${key}`;
    if (['@id', 'url', 'image', 'logo'].includes(key)) {
      const entries = Array.isArray(entry) ? entry : [entry];
      for (const item of entries) {
        assert(
          typeof item !== 'string' || /^https?:\/\//i.test(item),
          `JSON-LD ${nextPath} in ${route} should be absolute, found ${item}.`,
        );
      }
    }
    assertSchemaUrlsAreAbsolute(entry, route, nextPath);
  }
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assertExternalLinkConfig(name, config, expectedKeys) {
  const actualKeys = Object.keys(config).sort();
  const sortedExpectedKeys = [...expectedKeys].sort();
  const missingKeys = sortedExpectedKeys.filter((key) => !actualKeys.includes(key));
  const extraKeys = actualKeys.filter((key) => !sortedExpectedKeys.includes(key));

  assert(missingKeys.length === 0, `${name} config is missing keys: ${missingKeys.join(', ')}`);
  assert(extraKeys.length === 0, `${name} config contains unknown keys: ${extraKeys.join(', ')}`);

  for (const [key, value] of Object.entries(config)) {
    assert(
      value === null || /^https:\/\/\S+$/i.test(value),
      `${name}.${key} should be null while pending or an HTTPS URL when configured.`,
    );
  }
}

const routes = buildStaticRoutes();
const indexableRoutes = buildIndexableRoutes(rootDir);
const renderedRoutes = ['/', ...routes];
const routeSet = new Set(renderedRoutes);
const siteOrigin = new URL(siteUrl).origin;
const legalEntries = getLegalEntries(rootDir);
const expectedLegalEntryCount =
  supportedLanguages.length * Object.values(legalDocuments).reduce((total, docTypes) => total + docTypes.length, 0);
const pendingLegalRoutes = legalEntries.filter((entry) => entry.pending).map((entry) => entry.route);
const noIndexUtilityRoutes = supportedLanguages
  .map((language) => `/${language}/404`)
  .concat(neutralRouteAliases.map(({ path }) => path));

function normalizeRoutePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname || '/';
}

function resolveInternalTarget(value, route) {
  const target = value.trim();

  if (!target || target.startsWith('#')) return null;
  if (/^(?:data|mailto|tel|blob|javascript):/i.test(target)) return null;

  let url;
  try {
    const baseRoute = route.endsWith('/') ? route : `${route}/`;
    url = new URL(target, `${siteUrl}${baseRoute}`);
  } catch {
    failures.push(`Invalid URL target in ${route}: ${target}`);
    return null;
  }

  if (url.origin !== siteOrigin) return null;
  return normalizeRoutePath(url.pathname);
}

function internalTargetExists(pathname) {
  if (routeSet.has(pathname)) return true;

  const assetPath = resolve(distDir, pathname.replace(/^\/+/, ''));
  if (existsSync(assetPath)) return true;

  const htmlPath = resolve(distDir, `${pathname.replace(/^\/+/, '')}.html`);
  if (existsSync(htmlPath)) return true;

  const cleanIndexPath = resolve(distDir, pathname.replace(/^\/+/, ''), 'index.html');
  return existsSync(cleanIndexPath);
}

function assertInternalTargetsExist(route, html) {
  const attributePattern = /\s(href|poster|src)=["']([^"']+)["']/gi;

  for (const match of html.matchAll(attributePattern)) {
    const [, attribute, value] = match;
    const pathname = resolveInternalTarget(value, route);
    if (!pathname) continue;

    assert(
      internalTargetExists(pathname),
      `Broken internal ${attribute} target in ${route}: ${value} resolved to ${pathname}`,
    );
  }
}

function assertBlankTargetsAreSafe(route, html) {
  const blankLinkPattern = /<a\b[^>]*target="_blank"[^>]*>/gi;

  for (const match of html.matchAll(blankLinkPattern)) {
    const rel = /\srel="([^"]*)"/i.exec(match[0])?.[1] ?? '';
    const relValues = rel.split(/\s+/);
    assert(
      relValues.includes('noopener') && relValues.includes('noreferrer'),
      `External blank-target link in ${route} should use rel="noopener noreferrer": ${match[0]}`,
    );
  }
}

function collectFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? collectFiles(path) : [path];
  });
}

function normalizePath(path) {
  return path.replaceAll('\\', '/');
}

function relativeProjectPath(path) {
  return normalizePath(path).replace(`${normalizePath(rootDir)}/`, '');
}

function isSourceFile(path) {
  return /\.(?:js|jsx|json|css|html|mjs)$/i.test(path);
}

function assertRenderedHtmlInventory() {
  const expectedHtmlFiles = new Set(
    [
      distPath('/'),
      resolve(distDir, '404.html'),
      ...routes.flatMap((route) => [distPath(route), cleanUrlIndexPath(route)]),
    ].map(normalizePath),
  );
  const actualHtmlFiles = collectFiles(distDir)
    .filter((file) => file.endsWith('.html'))
    .map(normalizePath);
  const unexpectedHtmlFiles = actualHtmlFiles.filter((file) => !expectedHtmlFiles.has(file));
  const missingHtmlFiles = [...expectedHtmlFiles].filter((file) => !actualHtmlFiles.includes(file));

  assert(
    unexpectedHtmlFiles.length === 0,
    `Unexpected rendered HTML files found: ${unexpectedHtmlFiles.map(relativeProjectPath).join(', ')}`,
  );
  assert(
    missingHtmlFiles.length === 0,
    `Expected rendered HTML files are missing: ${missingHtmlFiles.map(relativeProjectPath).join(', ')}`,
  );
}

function assertLayerImports(layer, forbiddenSegments) {
  const layerDir = resolve(rootDir, 'src', 'components', layer);
  const importPattern = /^\s*import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/gm;

  for (const file of collectFiles(layerDir)) {
    const source = readFileSync(file, 'utf8');

    for (const match of source.matchAll(importPattern)) {
      const specifier = match[1];
      if (!specifier.startsWith('.')) continue;

      const targetPath = normalizePath(resolve(dirname(file), specifier));
      const forbiddenSegment = forbiddenSegments.find((segment) => targetPath.includes(segment));
      assert(
        !forbiddenSegment,
        `Atomic Design boundary violation in ${file}: ${layer} imports ${specifier}.`,
      );
    }
  }
}

function assertAtomicDesignBoundaries() {
  assertLayerImports('atoms', ['/src/components/molecules/', '/src/components/organisms/', '/src/pages/']);
  assertLayerImports('molecules', ['/src/components/organisms/', '/src/pages/']);
}

function assertPageShellContract() {
  const shellPath = resolve(rootDir, 'src', 'layouts', 'PageShell.jsx');
  assert(existsSync(shellPath), 'PageShell layout is missing.');

  if (existsSync(shellPath)) {
    const shellSource = readFileSync(shellPath, 'utf8');
    for (const expectedImport of ['SkipLink', 'SiteHeader', 'SiteFooter']) {
      assert(shellSource.includes(expectedImport), `PageShell should compose ${expectedImport}.`);
    }
  }

  const routedPageFiles = collectFiles(resolve(rootDir, 'src', 'pages')).filter((file) => {
    const path = normalizePath(file);
    return !path.endsWith('/RedirectToLocale.jsx') && !path.endsWith('/RedirectUnsupportedLanguage.jsx');
  });
  const directShellImports = [
    '../components/atoms/SkipLink',
    '../components/organisms/SiteHeader',
    '../components/organisms/SiteFooter',
  ];

  for (const file of routedPageFiles) {
    const source = readFileSync(file, 'utf8');
    assert(source.includes("../layouts/PageShell"), `Routed page should use PageShell: ${file}`);
    for (const directImport of directShellImports) {
      assert(!source.includes(directImport), `Routed page imports shell component directly: ${file}`);
    }
  }
}

function assertLocaleParity() {
  const expectedNamespaces = new Set(translationNamespaces);

  for (const language of supportedLanguages) {
    const localeDir = resolve(rootDir, 'src', 'i18n', 'locales', language);
    const actualNamespaces = readdirSync(localeDir)
      .filter((fileName) => fileName.endsWith('.json'))
      .map((fileName) => fileName.replace(/\.json$/, ''));
    const missingNamespaces = translationNamespaces.filter((namespace) => !actualNamespaces.includes(namespace));
    const extraNamespaces = actualNamespaces.filter((namespace) => !expectedNamespaces.has(namespace));

    assert(
      missingNamespaces.length === 0,
      `${language} locale directory is missing namespaces: ${missingNamespaces.join(', ')}`,
    );
    assert(
      extraNamespaces.length === 0,
      `${language} locale directory contains unregistered namespaces: ${extraNamespaces.join(', ')}`,
    );
  }

  const [referenceLanguage, ...comparisonLanguages] = supportedLanguages;

  for (const namespace of translationNamespaces) {
    const referencePath = resolve(rootDir, 'src', 'i18n', 'locales', referenceLanguage, `${namespace}.json`);
    const referenceKeys = new Set(flattenJsonKeys(JSON.parse(readFileSync(referencePath, 'utf8'))));

    for (const language of comparisonLanguages) {
      const localePath = resolve(rootDir, 'src', 'i18n', 'locales', language, `${namespace}.json`);
      const localeKeys = new Set(flattenJsonKeys(JSON.parse(readFileSync(localePath, 'utf8'))));
      const missingLocaleKeys = [...referenceKeys].filter((key) => !localeKeys.has(key));
      const missingReferenceKeys = [...localeKeys].filter((key) => !referenceKeys.has(key));

      assert(
        missingLocaleKeys.length === 0,
        `${language} ${namespace}.json is missing keys from ${referenceLanguage}: ${missingLocaleKeys.join(', ')}`,
      );
      assert(
        missingReferenceKeys.length === 0,
        `${referenceLanguage} ${namespace}.json is missing keys from ${language}: ${missingReferenceKeys.join(', ')}`,
      );
    }
  }

  const i18nSource = readFileSync(resolve(rootDir, 'src', 'i18n', 'config.js'), 'utf8');
  assertContains(i18nSource, 'ns: translationNamespaces', 'i18n should initialize namespaces from the shared namespace list.');
}

function assertPencilAssetManifest() {
  const assetsDir = resolve(rootDir, 'src', 'assets', 'pencil-placeholders');
  const indexPath = resolve(assetsDir, 'index.js');
  assert(existsSync(indexPath), 'Pencil placeholder asset manifest is missing.');
  if (!existsSync(indexPath)) return;

  const indexSource = readFileSync(indexPath, 'utf8');
  const exportSource = indexSource.slice(indexSource.indexOf('export const placeholderAssets'));
  const importMatches = [
    ...indexSource.matchAll(/^\s*import\s+([A-Za-z_$][\w$]*)\s+from\s+['"]\.\/([^'"]+)['"];?\s*$/gm),
  ];
  const importedAssets = new Map(importMatches.map(([, binding, fileName]) => [fileName, binding]));
  const assetFiles = collectFiles(assetsDir)
    .filter((file) => /\.(?:png|jpe?g|webp|avif|svg)$/i.test(file))
    .map((file) => relativeProjectPath(file).replace('src/assets/pencil-placeholders/', ''));

  for (const assetFile of assetFiles) {
    const binding = importedAssets.get(assetFile);
    assert(Boolean(binding), `Pencil placeholder asset is not imported through the manifest: ${assetFile}`);
    if (binding) {
      assert(
        exportSource.includes(binding),
        `Pencil placeholder asset is imported but not exposed through placeholderAssets: ${assetFile}`,
      );
    }
  }

  for (const [assetFile] of importedAssets) {
    assert(
      existsSync(resolve(assetsDir, assetFile)),
      `Pencil placeholder manifest imports a missing asset: ${assetFile}`,
    );
  }

  const appSourceFiles = collectFiles(resolve(rootDir, 'src')).filter(
    (file) => isSourceFile(file) && normalizePath(file) !== normalizePath(indexPath),
  );

  for (const file of appSourceFiles) {
    const source = readFileSync(file, 'utf8');
    assert(
      !/from\s+['"][^'"]*assets\/pencil-placeholders\//.test(source),
      `Pencil placeholder asset should be consumed through the manifest, not directly: ${relativeProjectPath(file)}`,
    );
  }
}

function assertPortfolioReferenceIsolation() {
  const referenceProjectFolder = 'Portfolio' + 'Website';
  const referenceProjectIgnoreEntry = `${referenceProjectFolder}/`;
  const gitignore = readFileSync(resolve(rootDir, '.gitignore'), 'utf8');
  assert(
    gitignore.split(/\r?\n/).includes(referenceProjectIgnoreEntry),
    `${referenceProjectFolder} should stay ignored because it is only a local reference project.`,
  );

  const scanTargets = [
    resolve(rootDir, 'index.html'),
    resolve(rootDir, 'package.json'),
    resolve(rootDir, 'vite.config.js'),
    ...collectFiles(resolve(rootDir, 'public')).filter(isSourceFile),
    ...collectFiles(resolve(rootDir, 'scripts')).filter(isSourceFile),
    ...collectFiles(resolve(rootDir, 'src')).filter(isSourceFile),
  ];

  for (const file of scanTargets) {
    const source = readFileSync(file, 'utf8');
    assert(
      !source.includes(referenceProjectFolder),
      `Final website source should not depend on the reference project: ${relativeProjectPath(file)}`,
    );
  }
}

for (const route of renderedRoutes) {
  readDist(route);
}

for (const route of routes) {
  const sourcePath = distPath(route);
  const indexPath = cleanUrlIndexPath(route);
  assert(existsSync(indexPath), `Missing static clean URL index mirror for ${route}: ${indexPath}`);
  if (existsSync(sourcePath) && existsSync(indexPath)) {
    assert(
      readFileSync(indexPath, 'utf8') === readFileSync(sourcePath, 'utf8'),
      `Static clean URL index mirror differs from rendered route file for ${route}.`,
    );
  }
}

assert(new Set(routes).size === routes.length, 'Static route list should not contain duplicate routes.');
assertRenderedHtmlInventory();
assertAtomicDesignBoundaries();
assertPageShellContract();
assertLocaleParity();
assertPencilAssetManifest();
assertPortfolioReferenceIsolation();

for (const file of collectFiles(resolve(rootDir, 'src')).filter(isSourceFile)) {
  const source = readFileSync(file, 'utf8');
  assert(!source.includes('Yasin Kuczma'), `Old founder spelling found in ${relativeProjectPath(file)}.`);
  assert(!source.includes('YASIN KUCZMA'), `Old uppercase founder spelling found in ${relativeProjectPath(file)}.`);
}

const routesSource = readFileSync(resolve(rootDir, 'src', 'routes', 'routes.jsx'), 'utf8');
assertContains(
  routesSource,
  'path: `${language}/*`',
  'Localized catch-all route is missing.',
);
assertContains(
  routesSource,
  'element: <Navigate replace to={`/${language}/404`} />',
  'Localized catch-all route should redirect to the explicit localized 404 route.',
);

const legalRegistrySource = readFileSync(resolve(rootDir, 'src', 'legal', 'registry.js'), 'utf8');
assertContains(
  legalRegistrySource,
  'throw new Error(`Missing legal document for ${scope}/${language}/${docType}`)',
  'Legal registry should fail clearly when a scoped legal document is missing.',
);

const legalDocumentSource = readFileSync(resolve(rootDir, 'src', 'components', 'organisms', 'LegalDocument.jsx'), 'utf8');
assertContains(legalDocumentSource, "block.type === 'h4'", 'Legal Markdown renderer should support h4 headings.');
assertContains(legalDocumentSource, "block.type === 'blockquote'", 'Legal Markdown renderer should support blockquotes.');
assertContains(legalDocumentSource, "block.type === 'separator'", 'Legal Markdown renderer should support horizontal rules.');
assertContains(legalDocumentSource, '<code key={key}>', 'Legal Markdown renderer should support inline code.');
assertContains(legalDocumentSource, '<em key={key}>', 'Legal Markdown renderer should support emphasis.');

const legalMarkdownFixture = parseLegalMarkdown(`# Title

#### Fine Print

> Quote one
> Quote two

---

1. Ordered item
- Bullet item`);
assert(
  legalMarkdownFixture.some((block) => block.type === 'h4' && block.text === 'Fine Print'),
  'Legal Markdown parser should parse h4 headings.',
);
assert(
  legalMarkdownFixture.some((block) => block.type === 'blockquote' && block.lines.length === 2),
  'Legal Markdown parser should group consecutive blockquote lines.',
);
assert(
  legalMarkdownFixture.some((block) => block.type === 'separator'),
  'Legal Markdown parser should parse horizontal rules.',
);

const languageSwitcherSource = readFileSync(resolve(rootDir, 'src', 'components', 'atoms', 'LanguageSwitcher.jsx'), 'utf8');
assertContains(
  languageSwitcherSource,
  "window.addEventListener('hashchange', syncHash)",
  'Language switcher should keep anchor hashes in sync after native hash navigation.',
);
assertContains(
  languageSwitcherSource,
  'getAlternateLanguageHref(switchLocation, targetLanguage)',
  'Language switcher should build alternate links from the hash-synced route state.',
);
assertContains(
  languageSwitcherSource,
  'window.location.hash ||',
  'Language switcher should derive direct hash-entry alternates from the browser hash.',
);
assertContains(
  languageSwitcherSource,
  'navigate(liveTargetHref)',
  'Language switcher should navigate with the live hash-aware target when static href state is stale.',
);

const appSource = readFileSync(resolve(rootDir, 'src', 'App.jsx'), 'utf8');
assertContains(appSource, 'scrollIntoView({ block: \'start\' })', 'App should scroll React Router hash routes to their target section.');
assertContains(appSource, "window.scrollTo({ top: 0, left: 0, behavior: 'auto' })", 'App should scroll to the top on non-hash route changes.');
assertContains(appSource, 'useSectionHashSync(pathname)', 'App should keep the URL hash synced with the active visible section.');

const sectionHashSyncSource = readFileSync(resolve(rootDir, 'src', 'hooks', 'useSectionHashSync.js'), 'utf8');
assertContains(sectionHashSyncSource, 'window.history.replaceState', 'Section hash sync should update the URL without triggering router navigation.');
assertContains(sectionHashSyncSource, "document.querySelectorAll('main section[id], main .section-anchor[id]')", 'Section hash sync should track semantic section anchors.');
assertContains(sectionHashSyncSource, "window.addEventListener('scroll', scheduleUpdate", 'Section hash sync should react to manual scrolling.');

const headerNavSource = readFileSync(resolve(rootDir, 'src', 'components', 'molecules', 'HeaderNav.jsx'), 'utf8');
assert(!headerNavSource.includes("href.includes('#')"), 'Header navigation should keep internal hash links in React Router state.');
assertContains(headerNavSource, 'className="link-underline-target"', 'Header nav links should use the shared animated underline target.');
assertContains(headerNavSource, 'className="link-underline-target__text"', 'Header nav underline should be scoped to the visible text.');

const siteHeaderSource = readFileSync(resolve(rootDir, 'src', 'components', 'organisms', 'SiteHeader.jsx'), 'utf8');
assertContains(siteHeaderSource, 'site-header--scrolled', 'Site header should expose a scrolled state for the fixed black background.');
assertContains(siteHeaderSource, "window.addEventListener('scroll', updateScrollState", 'Site header should react to page scroll position.');

const pageShellSource = readFileSync(resolve(rootDir, 'src', 'layouts', 'PageShell.jsx'), 'utf8');
assertContains(pageShellSource, 'useScrollReveal(mainRef)', 'PageShell should attach the shared GSAP scroll reveal behavior.');

const scrollRevealSource = readFileSync(resolve(rootDir, 'src', 'hooks', 'useScrollReveal.js'), 'utf8');
assertContains(scrollRevealSource, "import('gsap')", 'Scroll reveal should load GSAP lazily on the client.');
assertContains(scrollRevealSource, "import('gsap/ScrollTrigger')", 'Scroll reveal should use ScrollTrigger like the reference portfolio.');
assertContains(scrollRevealSource, "window.matchMedia('(prefers-reduced-motion: reduce)')", 'Scroll reveal should respect reduced-motion preferences.');
assertContains(scrollRevealSource, 'gsap.set(targets', 'Scroll reveal should set an initial hidden state before ScrollTrigger starts.');
assertContains(scrollRevealSource, 'gsap.to(targets', 'Scroll reveal should animate targets into view with GSAP.');
assertContains(scrollRevealSource, 'const yOffset = prefersReducedMotion ? 28 : 52;', 'Scroll reveal should keep vertical motion instead of becoming opacity-only.');
assert(!scrollRevealSource.includes('const yOffset = prefersReducedMotion ? 0'), 'Scroll reveal should not disable motion entirely for reduced-motion environments.');
assertContains(scrollRevealSource, "ease: 'power3.out'", 'Scroll reveal should use the stronger portfolio-style motion easing.');

const faqItemSource = readFileSync(resolve(rootDir, 'src', 'components', 'molecules', 'FaqItem.jsx'), 'utf8');
assertContains(faqItemSource, '<details className="faq-item">', 'FAQ items should render as native expandable details elements.');
assertContains(faqItemSource, '<summary onClickCapture={keepSummaryPosition}>', 'FAQ items should expose the question as a native summary control.');
assertContains(faqItemSource, 'event.preventDefault()', 'FAQ items should control the native details toggle to avoid browser scroll jumps.');
assertContains(faqItemSource, 'item.open = !item.open', 'FAQ items should still toggle the native details open state.');
assertContains(faqItemSource, 'restoreSummaryPosition(summary, topBeforeToggle)', 'FAQ items should preserve the clicked question position while expanding downward.');
assertContains(faqItemSource, 'window.scrollTo({ left: 0, top: window.scrollY + delta, behavior: \'auto\' })', 'FAQ position restoration should correct the current scroll position directly.');

const faqSectionSource = readFileSync(resolve(rootDir, 'src', 'components', 'organisms', 'FaqSection.jsx'), 'utf8');
assertContains(faqSectionSource, 'id="faq"', 'FAQ section should expose a stable section id for anchor navigation and URL hash sync.');

const projectCarouselSource = readFileSync(resolve(rootDir, 'src', 'components', 'molecules', 'ProjectCarousel.jsx'), 'utf8');
assertContains(projectCarouselSource, "import { Link } from 'react-router-dom';", 'Featured project cards should be full React Router links.');
assertContains(projectCarouselSource, 'className="project-card project-card--featured project-card--linkable"', 'Featured project cards should be fully clickable.');
assertContains(projectCarouselSource, 'className="button button--text project-card__link"', 'Featured project CTA should use the arrow link treatment.');
assertContains(projectCarouselSource, 'className="project-card__skeleton"', 'Project placeholder cards should render skeleton structure.');
assertContains(projectCarouselSource, 'className="project-card__empty-icon"', 'Project placeholder cards should render an empty image icon.');

const hoshiNewsSectionSource = readFileSync(resolve(rootDir, 'src', 'components', 'organisms', 'HoshiNewsSection.jsx'), 'utf8');
assertContains(hoshiNewsSectionSource, 'useState', 'Hoshi news should expose active slide state for navigation.');
assertContains(hoshiNewsSectionSource, 'className="news-section__skeletons"', 'Hoshi news should render right-side skeleton news cards.');
assertContains(hoshiNewsSectionSource, 'className="news-card news-card--featured news-card--linkable"', 'The selected Hoshi news card should be fully clickable.');

const placeholderImageSource = readFileSync(resolve(rootDir, 'src', 'components', 'atoms', 'PlaceholderImage.jsx'), 'utf8');
assertContains(placeholderImageSource, "loading = 'lazy'", 'Placeholder images should default to lazy loading.');
assertContains(placeholderImageSource, 'fetchpriority={fetchPriority}', 'Placeholder images should expose fetch priority for above-the-fold assets.');

const serviceHeroSource = readFileSync(resolve(rootDir, 'src', 'components', 'organisms', 'ServiceHero.jsx'), 'utf8');
assertContains(serviceHeroSource, 'fetchPriority="high"', 'Service hero placeholder image should request high fetch priority.');
assertContains(serviceHeroSource, 'loading="eager"', 'Service hero placeholder image should load eagerly above the fold.');
assertContains(serviceHeroSource, '<SectionKicker>{kicker}</SectionKicker>', 'Service hero should render descriptive service kicker labels, not route URLs.');

const mediaLinksSource = readFileSync(resolve(rootDir, 'src', 'config', 'mediaLinks.js'), 'utf8');
assertExternalLinkConfig('hoshiMediaLinks', hoshiMediaLinks, ['trailer']);
assertExternalLinkConfig('hoshiStoreLinks', hoshiStoreLinks, ['appStore', 'googlePlay']);
assertExternalLinkConfig('hoshiSocialLinks', hoshiSocialLinks, ['instagram', 'reddit', 'linkedin']);
assertExternalLinkConfig('yakumaSocialLinks', yakumaSocialLinks, ['linkedin']);
assertContains(mediaLinksSource, 'trailer:', 'Hoshi trailer URL should stay an explicit config value.');

const hoshiPageSource = readFileSync(resolve(rootDir, 'src', 'pages', 'HoshiPage.jsx'), 'utf8');
assertContains(hoshiPageSource, "hoshiMediaLinks.trailer ?? '#trailer'", 'Hoshi trailer CTA should use the media-link config with an anchor fallback.');
assertContains(hoshiPageSource, 'href={hoshiMediaLinks.trailer}', 'Hoshi trailer play control should become a link when the real trailer URL is configured.');

const landingPageSource = readFileSync(resolve(rootDir, 'src', 'pages', 'LandingPage.jsx'), 'utf8');
assertContains(landingPageSource, 'className="landing-hero" id="hero"', 'Landing hero should expose a stable hash target so top-of-page reloads stay at the hero.');

const externalLinkSourceChecks = [
  ['src/components/molecules/StoreBadge.jsx', 'rel="noopener noreferrer"'],
  ['src/components/molecules/SocialProfileLink.jsx', 'rel="noopener noreferrer"'],
  ['src/components/organisms/LegalDocument.jsx', 'rel="noopener noreferrer"'],
  ['src/components/atoms/Button.jsx', "rel: 'noopener noreferrer'"],
  ['src/components/atoms/PlayPlaceholderButton.jsx', 'rel="noopener noreferrer"'],
];

for (const [relativePath, expected] of externalLinkSourceChecks) {
  const source = readFileSync(resolve(rootDir, relativePath), 'utf8');
  assertContains(source, expected, `${relativePath} should secure external links opened in a new tab.`);
  assert(!source.includes('rel="noreferrer"'), `${relativePath} should not omit noopener on external links.`);
}

const footerLinksSource = readFileSync(resolve(rootDir, 'src', 'components', 'molecules', 'FooterLinks.jsx'), 'utf8');
assertContains(footerLinksSource, 'useLocation', 'Footer legal links should read the current route.');
assertContains(footerLinksSource, "aria-current={currentPath === link.to ? 'page' : undefined}", 'Footer legal links should mark the active legal document.');
assertContains(footerLinksSource, 'className="link-underline-target"', 'Footer links should use the shared animated underline target.');
assertContains(footerLinksSource, 'className="link-underline-target__text"', 'Footer link underline should be scoped to the visible text.');

assert(
  getAlternateLanguageHref({ pathname: '/de/games/hoshi', search: '?utm=test', hash: '#faq' }, 'en') ===
    '/en/games/hoshi?utm=test#faq',
  'Language switcher should preserve query and hash for exact route equivalents.',
);
assert(
  getAlternateLanguageHref({ pathname: '/de/does-not-exist', search: '?utm=test', hash: '#missing' }, 'en') === '/en',
  'Language switcher should fall back to the target language home for unknown localized routes.',
);
assert(
  getAlternateLanguagePath('/fr/does-not-exist', 'de') === '/de',
  'Language switcher should fall back to the target language home for unsupported language prefixes.',
);
assert(
  getAlternateLanguageHref({ pathname: '/de/404', search: '', hash: '' }, 'en') === '/en/404',
  'Language switcher should preserve the explicit static 404 route.',
);
assert(
  localizedHref('de', '/#about') === '/de#about',
  'Root anchor links should not insert a trailing slash after the language prefix.',
);
assert(
  localizedHref('en', '/#contact') === '/en#contact',
  'English root anchor links should not insert a trailing slash after the language prefix.',
);

const cssSource = readFileSync(resolve(rootDir, 'src', 'styles', 'main.css'), 'utf8');
const indexSource = readFileSync(resolve(rootDir, 'index.html'), 'utf8');
const packageSource = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf8'));
assert(packageSource.dependencies?.gsap, 'GSAP should be installed for scroll-triggered transitions.');
assert(packageSource.dependencies?.['@hcaptcha/react-hcaptcha'], 'React hCaptcha should be installed for the Web3Forms contact form.');
assertContains(indexSource, 'family=Anton', 'Pencil Anton font should be loaded from Google Fonts.');
assertContains(indexSource, 'family=IBM+Plex+Mono', 'Pencil IBM Plex Mono font should be loaded from Google Fonts.');
assertContains(indexSource, 'family=Inter', 'Pencil Inter font should be loaded from Google Fonts.');
assertContains(indexSource, 'family=Montserrat', 'Pencil Montserrat font should be loaded from Google Fonts.');
assertContains(cssSource, '--font-heading: "Anton", system-ui, sans-serif;', 'Yakuma heading font should match Pencil Anton stack.');
assertContains(cssSource, '--font-body: "Inter", system-ui, sans-serif;', 'Body font should match Pencil Inter stack.');
assertContains(cssSource, '--font-mono: "IBM Plex Mono", system-ui, sans-serif;', 'Tag/nav font should match Pencil IBM Plex Mono stack.');
assertContains(cssSource, '--font-hoshi: "Montserrat", system-ui, sans-serif;', 'Hoshi font should match Pencil Montserrat stack.');
assertContains(cssSource, '--content-wide: 1260px;', 'Desktop wide content token should match the projects carousel width.');
assertContains(cssSource, '--content-body: 1212px;', 'Desktop body content token should match the projects header width.');
assert(
  /html\s*\{\s*font-family: var\(--font-body\);/.test(cssSource),
  'Root document should default to Inter before body/form inheritance.',
);
assert(!/body,\s*\n\s*button,\s*\n\s*input/.test(cssSource), 'Body should not be reset with font: inherit after declaring the Inter font stack.');
assert(
  /button,\s*\n\s*input,\s*\n\s*select,\s*\n\s*textarea\s*\{\s*font: inherit;/.test(cssSource),
  'Form controls should inherit the Inter typography stack.',
);
assertContains(cssSource, '--header-height: 6rem;', 'The fixed header height should be exposed as a shared layout token.');
assertContains(cssSource, '--hero-screen: 100svh;', 'Hero sections should use the full viewport because the fixed header overlays them.');
assertContains(cssSource, '--section-screen: calc(100svh - var(--header-height));', 'Desktop sections should fit the viewport after subtracting the fixed header height.');
assertContains(cssSource, '--hoshi-hero-screen: 100svh;', 'Hoshi hero should use the full viewport because the fixed header overlays it.');
assertContains(cssSource, 'min-height: var(--section-screen);', 'Sections should use the shared viewport-based desktop min-height.');
assertContains(cssSource, 'scroll-margin-top: var(--header-height);', 'Hash navigation should land section tops directly under the fixed header.');
assertContains(cssSource, 'overflow-anchor: none;', 'Document scroll anchoring should be disabled so FAQ expansion grows downward without moving the clicked question.');
assertContains(cssSource, '.section-anchor', 'Stable section anchor styles should be present.');
assertContains(cssSource, 'p:not(.section-kicker)', 'Body-copy paragraph rules should not override section kicker spacing.');
assertContains(cssSource, 'text-align: justify;', 'Body-copy text should render in justified alignment.');
assertContains(cssSource, 'hyphens: auto;', 'Justified body-copy text should allow browser hyphenation.');
assertContains(cssSource, 'text-align-last: left;', 'Justified body-copy text should keep the last line readable.');
assertContains(cssSource, 'grid-template-columns: minmax(12rem, 1fr) auto minmax(12rem, 1fr);', 'Desktop header nav should be centered against the full viewport width.');
assertContains(cssSource, 'position: fixed;', 'Site header should overlay content instead of taking layout space.');
assertContains(cssSource, '.site-header--scrolled::before', 'Site header should fade its background layer through the pseudo element state.');
assertContains(cssSource, 'opacity 520ms ease', 'Site header background should fade in smoothly.');
assertContains(cssSource, 'transition-duration: 520ms, 520ms !important;', 'Header background fade should stay visible even when reduced motion is active.');
assertContains(cssSource, '.site-header--scrolled', 'Site header should switch to a black scrolled state.');
assertContains(cssSource, '.landing-hero__content', 'Landing hero content style is missing.');
assertContains(cssSource, 'position: absolute;', 'Landing hero content should be positioned across the full hero screen for optical centering.');
assertContains(cssSource, '.service-list a::after', 'Landing service links should render arrow icons.');
assertContains(cssSource, 'transform: translateX(0.25rem) rotate(45deg);', 'Landing service arrow icons should move on hover/focus.');
assertContains(cssSource, '.link-underline-target__text::after', 'Animated link underlines should be scoped directly to text spans.');
assertContains(cssSource, '.project-card__link::after', 'Featured project CTA should render a trailing arrow icon.');
assertContains(cssSource, '.project-card--linkable:hover .project-card__link::before', 'Clickable project cards should animate an underline under the text link.');
assertContains(cssSource, '.news-card--linkable:hover .news-card__link::before', 'Hoshi news read links should animate an underline on hover.');
assertContains(cssSource, 'transition-duration: 220ms !important;', 'Link underline animation should remain visible even when reduced motion is active.');
assertContains(cssSource, '.project-card__skeleton', 'Project side placeholders should include visible skeleton structure.');
assertContains(cssSource, 'aspect-ratio: 2 / 3;', 'Project cards should match the portrait ratio from the Pencil design.');
assertContains(cssSource, 'background: transparent;', 'Carousel arrow controls should not render a filled button background.');
assertContains(cssSource, '.project-card__empty-icon', 'Project skeletons should show an empty image icon.');
assert(!cssSource.includes('.link-underline-target::after'), 'Shared underline should not span whole link/button surfaces.');
assert(!cssSource.includes('.project-card__skeleton-visual,\n.project-card__skeleton-line {\n  background: linear-gradient'), 'Project skeletons should be static dark gray, not animated loading shimmers.');
assertContains(cssSource, '.faq-item summary', 'FAQ question controls should be styled as large clickable summaries.');
assertContains(cssSource, 'align-content: start;', 'FAQ rows should stay top-aligned when answers expand.');
assertContains(cssSource, 'grid-template-columns: minmax(300px, 430px) minmax(0, 740px);', 'FAQ and contact content should use the same wide center columns as projects.');
assertContains(cssSource, '.text-field--large textarea', 'Contact message field should have a larger textarea surface.');
assertContains(cssSource, '.contact-form__captcha', 'Contact form should reserve space for hCaptcha.');
assertContains(cssSource, 'justify-content: center;', 'Contact hCaptcha should be centered above the submit button.');
assertContains(cssSource, '.contact-form__honeypot', 'Contact form should include an invisible botcheck honeypot field.');
assertContains(cssSource, '.contact-form__status--success', 'Contact form should expose a success status state.');
assertContains(cssSource, '.contact-form__status--error', 'Contact form should expose an error status state.');
assertContains(cssSource, 'border-top: 1px solid rgba(255, 255, 255, 0.18);', 'Footer should include the Pencil divider line.');
assertContains(cssSource, '.site-footer > div', 'Footer grid should pin brand copy apart from right-aligned legal content.');
assertContains(
  cssSource,
  'grid-template-columns: minmax(250px, 310px) minmax(360px, 430px) minmax(250px, 310px);',
  'Project carousel should use larger Pencil portrait card proportions for side and featured cards.',
);
assertContains(cssSource, '--section-title-align-offset', 'Secondary columns should align to the main section title start.');
assertContains(cssSource, '--hoshi-section-news: #f5efe5;', 'Hoshi sections should use distinct sequential section backgrounds.');
assertContains(cssSource, 'grid-template-columns: minmax(0, var(--content-wide));', 'Hoshi news should use the same wide content rhythm as the landing projects.');
assertContains(cssSource, 'left: calc(50% + clamp(340px, 30vw, 420px));', 'Hoshi side news cards should sit farther to the right of the centered selected card.');
assertContains(cssSource, 'grid-template-columns: repeat(2, clamp(285px, 21vw, 360px));', 'Hoshi side news cards should be substantially larger.');
assertContains(cssSource, '.news-section__feature', 'Hoshi news navigation should live under the active card without taking header columns.');
assertContains(cssSource, 'border-radius: 18px;', 'Hoshi news cards should use rounded corners.');
assertContains(cssSource, '.gameplay-card-row', 'Hoshi gameplay loop should render visual cards instead of the old tactic board.');
assertContains(cssSource, '.news-card__empty-icon', 'Hoshi news articles should use placeholder icons instead of article images.');
assertContains(cssSource, '.faq-section--hoshi .faq-section__intro p', 'Hoshi FAQ description should be explicitly left-aligned and justified.');
assertContains(cssSource, '.skip-link', 'Skip-link styles are missing.');
assertContains(cssSource, '@media (prefers-reduced-motion: reduce)', 'Reduced-motion media query is missing.');
assertContains(cssSource, '@media (max-width: 1100px)', 'Tablet/mobile navigation breakpoint is missing.');
assertContains(cssSource, '@media (max-width: 720px)', 'Small mobile breakpoint is missing.');
assertContains(cssSource, '.header-nav--desktop', 'Desktop navigation breakpoint styles are missing.');
assertContains(cssSource, '.menu-toggle', 'Mobile menu toggle styles are missing.');
assertContains(cssSource, '.site-header__mobile-menu[hidden]', 'Mobile menu hidden-state styles are missing.');
assertAppearsInOrder(
  cssSource,
  ['@media (max-width: 1100px)', '.header-nav--desktop', 'display: none', '.menu-toggle', 'display: inline-flex'],
  'Mobile breakpoint should hide desktop nav and reveal the menu toggle.',
);

const rootPage = readDist('/');
assertContains(rootPage, '<title data-rh="true">Yakuma</title>', 'Root redirect page title is missing from static head.');
assertContains(rootPage, 'name="description" content="Yakuma is a modern product studio', 'Root redirect page description is missing.');
assertContains(rootPage, 'name="robots" content="noindex, follow"', 'Root redirect page should be noindex, follow.');
assertContains(rootPage, `rel="canonical" href="${siteUrl}/${defaultLanguage}"`, 'Root redirect page canonical should point to the default localized route.');
assertContains(rootPage, 'name="theme-color" content="#050505"', 'Root page should expose the fixed Yakuma browser theme color.');
assertContains(rootPage, 'rel="manifest" href="/site.webmanifest"', 'Root page should link the web app manifest.');
assertContains(rootPage, "window.location.replace('/en' + window.location.search + window.location.hash)", 'Root redirect page should replace the root URL with the English fallback.');
assertContains(rootPage, '<noscript', 'Root redirect page should include a no-JavaScript fallback.');
assertContains(rootPage, 'http-equiv="refresh"', 'Root redirect page no-JavaScript meta refresh is missing.');
assert(
  rootPage.includes('<meta data-rh="true" http-equiv="refresh" content="0;url=/en"'),
  'Root redirect should emit an immediate meta refresh to the English fallback.',
);

for (const { path, target } of neutralRouteAliases) {
  const aliasPage = readDist(path);
  assertContains(aliasPage, `http-equiv="refresh" content="0;url=${target}"`, `${path} should meta-refresh to ${target}.`);
  assertContains(aliasPage, `rel="canonical" href="${siteUrl}${target}"`, `${path} should canonicalize to ${target}.`);
  assertContains(aliasPage, 'name="robots" content="noindex, follow"', `${path} should be noindex, follow.`);
  assertContains(aliasPage, `href="${target}"`, `${path} should provide a no-JavaScript fallback link.`);
  assertContains(
    aliasPage,
    `window.location.replace(${JSON.stringify(target)} + window.location.search + window.location.hash);`,
    `${path} should preserve query strings and fragments when JavaScript is available.`,
  );
}

assert(
  legalEntries.length === expectedLegalEntryCount,
  `Expected ${expectedLegalEntryCount} legal registry entries, found ${legalEntries.length}.`,
);
for (const entry of legalEntries) {
  assert(existsSync(entry.markdownPath), `Legal document file is missing: ${entry.markdownPath}`);
  assert(entry.markdown.trim().length > 0, `Legal document ${entry.scope}/${entry.language}/${entry.docType} is empty.`);
  const html = readDist(entry.route);
  const hasNoIndex = html.includes('name="robots" content="noindex, nofollow"');
  assert(
    hasNoIndex === entry.pending,
    `Legal noindex mismatch for ${entry.route}: pending=${entry.pending}, noindex=${hasNoIndex}.`,
  );
}

assert(!existsSync(resolve(distDir, 'hoshi.html')), 'Unexpected legacy /hoshi route was generated.');

for (const sitemapFile of ['public/sitemap.xml', 'dist/sitemap.xml']) {
  const sitemapPath = resolve(rootDir, sitemapFile);
  const sitemap = existsSync(sitemapPath) ? readFileSync(sitemapPath, 'utf8') : '';
  const actualUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  const expectedUrls = indexableRoutes.map((route) => `${siteUrl}${route}`);
  const missingUrls = expectedUrls.filter((url) => !actualUrls.includes(url));
  const extraUrls = actualUrls.filter((url) => !expectedUrls.includes(url));
  const noIndexUrls = pendingLegalRoutes
    .concat(noIndexUtilityRoutes)
    .map((route) => `${siteUrl}${route}`)
    .filter((url) => actualUrls.includes(url));

  assert(missingUrls.length === 0, `${sitemapFile} misses URLs: ${missingUrls.join(', ')}`);
  assert(extraUrls.length === 0, `${sitemapFile} contains extra URLs: ${extraUrls.join(', ')}`);
  assert(noIndexUrls.length === 0, `${sitemapFile} contains noindex legal URLs: ${noIndexUrls.join(', ')}`);
  assertContains(
    sitemap,
    'xmlns:xhtml="http://www.w3.org/1999/xhtml"',
    `${sitemapFile} should declare the XHTML namespace for hreflang alternates.`,
  );
  assertContains(
    sitemap,
    `<xhtml:link rel="alternate" hreflang="de" href="${siteUrl}/de" />`,
    `${sitemapFile} should include the German landing page hreflang alternate.`,
  );
  assertContains(
    sitemap,
    `<xhtml:link rel="alternate" hreflang="en" href="${siteUrl}/en" />`,
    `${sitemapFile} should include the English landing page hreflang alternate.`,
  );
  assertContains(
    sitemap,
    `<xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}/${defaultLanguage}" />`,
    `${sitemapFile} should include the default landing page hreflang alternate.`,
  );
  assertContains(
    sitemap,
    `<xhtml:link rel="alternate" hreflang="en" href="${siteUrl}/en/games/hoshi" />`,
    `${sitemapFile} should include Hoshi game page hreflang alternates.`,
  );
  assert(
    !sitemap.includes(`${siteUrl}/en/games/hoshi/legal/privacy-policy`),
    `${sitemapFile} should not include pending English Hoshi privacy policy as a URL or alternate.`,
  );
  assert(
    !sitemap.includes(`${siteUrl}/de/legal/imprint`),
    `${sitemapFile} should not include pending Yakuma legal pages as URLs or alternates.`,
  );
}

for (const robotsFile of ['public/robots.txt', 'dist/robots.txt']) {
  const robotsPath = resolve(rootDir, robotsFile);
  const robots = existsSync(robotsPath) ? readFileSync(robotsPath, 'utf8') : '';
  assertContains(robots, 'User-agent: *', `${robotsFile} is missing the user-agent rule.`);
  assertContains(robots, 'Allow: /', `${robotsFile} is missing the allow rule.`);
  assertContains(robots, `Sitemap: ${siteUrl}/sitemap.xml`, `${robotsFile} points to the wrong sitemap URL.`);
}

for (const manifestFile of ['public/site.webmanifest', 'dist/site.webmanifest']) {
  const manifestPath = resolve(rootDir, manifestFile);
  const manifest = existsSync(manifestPath) ? readFileSync(manifestPath, 'utf8') : '';
  let parsedManifest = {};

  try {
    parsedManifest = JSON.parse(manifest);
  } catch (error) {
    failures.push(`${manifestFile} is not valid JSON: ${error.message}`);
  }

  assert(parsedManifest.name === 'Yakuma', `${manifestFile} should expose the Yakuma app name.`);
  assert(parsedManifest.start_url === '/de', `${manifestFile} should start at the default localized route.`);
  assert(parsedManifest.scope === '/', `${manifestFile} should cover the whole static site.`);
  assert(parsedManifest.theme_color === '#050505', `${manifestFile} has the wrong theme color.`);
  assert(
    parsedManifest.icons?.some((icon) => icon.src === '/favicon.svg' && icon.type === 'image/svg+xml'),
    `${manifestFile} should reuse the SVG favicon as an install icon.`,
  );
}

for (const cnameFile of ['public/CNAME', 'dist/CNAME']) {
  const cnamePath = resolve(rootDir, cnameFile);
  assert(existsSync(cnamePath), `${cnameFile} is missing.`);
  if (existsSync(cnamePath)) {
    assert(
      readFileSync(cnamePath, 'utf8').trim() === new URL(siteUrl).hostname,
      `${cnameFile} should match the configured site hostname.`,
    );
  }
}

for (const noJekyllFile of ['public/.nojekyll', 'dist/.nojekyll']) {
  assert(existsSync(resolve(rootDir, noJekyllFile)), `${noJekyllFile} is missing.`);
}

for (const headersFile of ['public/_headers', 'dist/_headers']) {
  const headersPath = resolve(rootDir, headersFile);
  assert(existsSync(headersPath), `${headersFile} is missing.`);
  const headers = existsSync(headersPath) ? readFileSync(headersPath, 'utf8') : '';
  assertContains(headers, 'X-Content-Type-Options: nosniff', `${headersFile} should prevent MIME sniffing.`);
  assertContains(headers, 'Referrer-Policy: strict-origin-when-cross-origin', `${headersFile} should define a referrer policy.`);
  assertContains(headers, 'X-Frame-Options: DENY', `${headersFile} should deny framing.`);
  assertContains(headers, 'Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()', `${headersFile} should disable unused browser permissions.`);
  assertContains(headers, 'Cache-Control: public, max-age=31536000, immutable', `${headersFile} should cache fingerprinted assets immutably.`);
  assert(!headers.includes('Content-Security-Policy'), `${headersFile} should not ship a CSP before inline SSG scripts are nonce-managed.`);
}

const hoshiPage = readDist('/de/games/hoshi');
const hoshiSchemaNodes = assertSchemaType(hoshiPage, '/de/games/hoshi', 'VideoGame');
assertSchemaUrlsAreAbsolute(hoshiSchemaNodes, '/de/games/hoshi');
assertFaqSchema(hoshiSchemaNodes, '/de/games/hoshi', 5);
assertContains(hoshiPage, '<title data-rh="true">Hoshi: Star Sudoku | Yakuma</title>', 'Hoshi page title is missing from static head.');
assertContains(hoshiPage, '<header class="site-header site-header--hoshi site-header--at-top">', 'Hoshi page should render the sticky header top state.');
assertContains(hoshiPage, `href="${siteUrl}/en/games/hoshi" hreflang="en"`, 'Hoshi page English hreflang is missing.');
assertContains(hoshiPage, `href="${siteUrl}/de/games/hoshi" hreflang="x-default"`, 'Hoshi page x-default hreflang is missing.');
assertContains(hoshiPage, 'property="og:site_name" content="Yakuma"', 'Hoshi page Open Graph site name is missing.');
assertContains(hoshiPage, 'property="og:locale:alternate"', 'Hoshi page Open Graph locale alternate is missing.');
assertContains(hoshiPage, `property="og:image" content="${siteUrl}/assets/hoshi-hero-background-placeholder`, 'Hoshi page Open Graph image is missing.');
assertContains(hoshiPage, 'property="og:image:alt" content="Hoshi: Star Sudoku Hero-Visual"', 'Hoshi page Open Graph image alt is missing.');
assertContains(hoshiPage, `name="twitter:image" content="${siteUrl}/assets/hoshi-hero-background-placeholder`, 'Hoshi page Twitter image is missing.');
assertContains(hoshiPage, 'name="twitter:image:alt" content="Hoshi: Star Sudoku Hero-Visual"', 'Hoshi page Twitter image alt is missing.');
assertContains(hoshiPage, 'id="trailer"', 'Hoshi trailer placeholder anchor is missing.');
assertContains(hoshiPage, 'class="play-placeholder-button"', 'Hoshi trailer play placeholder is missing.');
if (hoshiMediaLinks.trailer) {
  assertContains(hoshiPage, `href="${hoshiMediaLinks.trailer}"`, 'Configured Hoshi trailer URL is missing from the rendered page.');
  assertContains(hoshiPage, 'play-placeholder-button play-placeholder-button--link', 'Configured Hoshi trailer should render the play control as a link.');
  assert(!hoshiPage.includes('aria-label="Trailer folgt"'), 'Configured Hoshi trailer should not keep the pending trailer label.');
} else {
  assertContains(hoshiPage, 'href="/de/games/hoshi#trailer"', 'Hoshi trailer CTA should target the trailer placeholder.');
  assertContains(hoshiPage, 'aria-label="Trailer folgt"', 'Hoshi trailer pending label is missing.');
}
assertContains(hoshiPage, 'alt="Hoshi Trailer-Vorschau mit Sternmotiv"', 'Hoshi trailer visual alt text is missing.');
assertContains(hoshiPage, 'class="gameplay-card-row"', 'Hoshi gameplay loop visual card row is missing.');
assert(countMatches(hoshiPage, /class="gameplay-card"/g) === 3, 'Hoshi gameplay loop should render three visual cards.');
assertContains(hoshiPage, 'SOLVE BOARDS', 'Hoshi gameplay solve boards card is missing.');
assertContains(hoshiPage, 'LEARN NEW TACTICS', 'Hoshi gameplay tactics card is missing.');
assertContains(hoshiPage, 'LEVEL UP', 'Hoshi gameplay level card is missing.');
assertContains(hoshiPage, 'class="hoshi-social-mockup"', 'Hoshi community phone mockup stage is missing.');
assertContains(hoshiPage, 'alt="Hoshi Community-Feed iPhone-Mockup"', 'Hoshi community phone mockup visual alt text is missing.');
assertContains(hoshiPage, 'class="news-section__description"', 'Hoshi news description should sit beside the section title.');
assertContains(hoshiPage, 'class="news-section__nav"', 'Hoshi news navigation controls are missing.');
assertContains(hoshiPage, 'aria-label="Vorherige News"', 'Hoshi previous news control label is missing.');
assertContains(hoshiPage, 'aria-label="Nächste News"', 'Hoshi next news control label is missing.');
assertContains(hoshiPage, 'class="news-card news-card--featured news-card--linkable"', 'Hoshi selected news card should be clickable.');
assert(countMatches(hoshiPage, /class="news-card news-card--skeleton"/g) === 2, 'Hoshi news should render two right-side skeleton cards.');
assertContains(hoshiPage, 'class="news-card__link"', 'Hoshi news should render a read link label.');
assert(countMatches(hoshiPage, /class="news-card__empty-icon"/g) === 3, 'Hoshi news should render placeholder icons for featured and skeleton cards.');
assertContains(hoshiPage, '<section class="download-section" id="download">', 'Hoshi final download section anchor is missing.');
assertContains(hoshiPage, 'class="tablet-stage"', 'Hoshi final device stage is missing.');
assertContains(hoshiPage, 'src="/assets/hoshi-final-device-placeholder', 'Hoshi final download section should use the Pencil final device mockup.');
assertContains(hoshiPage, 'alt="Hoshi: Star Sudoku Download-Vorschau"', 'Hoshi final device stage image alt text is missing.');
assert(countMatches(hoshiPage, /<details class="faq-item">/g) === 5, 'Hoshi FAQ should render all questions as expandable details elements.');
assert(!hoshiPage.includes('<strong>HOSHI<br/>STAR SUDOKU</strong>'), 'Hoshi final device stage should not duplicate text already contained in the Pencil mockup.');
assert(countMatches(hoshiPage, /data-store="app-store"/g) === 2, 'Hoshi App Store badge count is wrong.');
assert(countMatches(hoshiPage, /data-store="google-play"/g) === 2, 'Hoshi Google Play badge count is wrong.');
for (const [storeKey, storeSlug] of [
  ['appStore', 'app-store'],
  ['googlePlay', 'google-play'],
]) {
  const storeUrl = hoshiStoreLinks[storeKey];
  if (storeUrl) {
    assertContains(hoshiPage, `href="${storeUrl}"`, `Configured Hoshi ${storeKey} URL is missing from store badges.`);
    assertContains(hoshiPage, `class="store-badge store-badge--link link-underline-target" data-store="${storeSlug}"`, `Configured Hoshi ${storeKey} should render as linked store badges.`);
  } else {
    assert(
      countMatches(hoshiPage, new RegExp(`class="store-badge store-badge--pending"[^>]*data-store="${storeSlug}"`, 'g')) === 2,
      `Pending Hoshi ${storeKey} badges should expose their pending state.`,
    );
  }
}
assert(countMatches(hoshiPage, /data-profile="(?:instagram|reddit|linkedin)"/g) === 3, 'Hoshi social profile metadata is missing.');
for (const profile of ['instagram', 'reddit', 'linkedin']) {
  const profileUrl = hoshiSocialLinks[profile];
  if (profileUrl) {
    assertContains(hoshiPage, `href="${profileUrl}"`, `Configured Hoshi ${profile} URL is missing from social links.`);
    assertContains(hoshiPage, `class="social-label social-label--link link-underline-target" data-profile="${profile}"`, `Configured Hoshi ${profile} should render as a social link.`);
  } else {
    assertContains(hoshiPage, `class="social-label social-label--pending" data-profile="${profile}"`, `Pending Hoshi ${profile} social profile should expose its pending state.`);
  }
}
assert(
  hoshiSchemaNodes.some((node) => node.name === 'Hoshi: Star Sudoku' && node.url === `${siteUrl}/de/games/hoshi`),
  'Hoshi VideoGame schema has the wrong name or URL.',
);
assert(countMatches(hoshiPage, /<title/g) === 1, 'Hoshi page should contain exactly one title tag.');
assert(!hoshiPage.includes('name="robots"'), 'Real Hoshi page should not emit a noindex robots tag.');

const landingPage = readDist('/de');
const landingSchemaNodes = assertSchemaType(landingPage, '/de', 'Organization');
assertSchemaType(landingPage, '/de', 'WebSite');
assertSchemaUrlsAreAbsolute(landingSchemaNodes, '/de');
assertFaqSchema(landingSchemaNodes, '/de', 5);
assertContains(landingPage, `href="${siteUrl}/de" hreflang="x-default"`, 'Landing page x-default hreflang is missing.');
assertContains(landingPage, 'property="og:locale:alternate"', 'Landing page Open Graph locale alternate is missing.');
assertContains(landingPage, `property="og:image" content="${siteUrl}/assets/yakuma-hero-placeholder`, 'Landing page Open Graph image is missing.');
assertContains(landingPage, 'property="og:image:alt" content="Yakuma | Software, Games, digitale Systeme"', 'Landing page Open Graph image alt is missing.');
assertContains(landingPage, 'name="twitter:image:alt" content="Yakuma | Software, Games, digitale Systeme"', 'Landing page Twitter image alt is missing.');
assertContains(landingPage, '<header class="site-header site-header--transparent site-header--at-top">', 'Landing page should render the transparent sticky header top state.');
assertContains(landingPage, 'alt="Editoriales Yakuma-Visual zur Studioarbeit"', 'Landing about visual alt text is missing.');
assertContains(landingPage, 'alt="Editoriales Yakuma-Visual für Software, Games und digitale Systeme"', 'Landing services visual alt text is missing.');
assertContains(landingPage, 'alt="Hoshi: Star Sudoku Projektvorschau"', 'Landing Hoshi project visual alt text is missing.');
assertContains(landingPage, 'class="menu-toggle"', 'Landing page mobile menu toggle is missing.');
assertContains(landingPage, 'aria-controls="site-mobile-navigation"', 'Landing page mobile menu control binding is missing.');
assertContains(landingPage, 'aria-label="Navigation öffnen"', 'Landing page mobile menu label is missing.');
assertContains(landingPage, 'id="site-mobile-navigation"', 'Landing page mobile navigation panel is missing.');
assertContains(landingPage, 'aria-label="Mobile Hauptnavigation"', 'Landing page localized mobile navigation label is missing.');
assertContains(landingPage, 'aria-current="page"', 'Landing page active language marker is missing.');
assert(!landingPage.includes('href="/de/#'), 'German landing page should not render root anchor links with a trailing slash.');
assertContains(landingPage, 'data-profile="linkedin"', 'Landing social profile metadata is missing.');
if (yakumaSocialLinks.linkedin) {
  assertContains(landingPage, `href="${yakumaSocialLinks.linkedin}"`, 'Configured Yakuma LinkedIn URL is missing from the landing page.');
  assertContains(landingPage, 'class="landing-hero__social landing-hero__social--link link-underline-target"', 'Configured Yakuma LinkedIn should render as a link.');
} else {
  assertContains(landingPage, 'class="landing-hero__social landing-hero__social--pending"', 'Landing social profile should render as a pending placeholder until a real profile URL is configured.');
}
assert(!landingPage.includes('href="https://www.linkedin.com/"'), 'Landing page should not link to the generic LinkedIn homepage.');
assert(countMatches(landingPage, /class="carousel-arrow carousel-arrow--/g) === 2, 'Landing project carousel arrow controls are missing.');
assertContains(landingPage, 'aria-label="Vorheriges Projekt"', 'Landing previous project arrow label is missing.');
assertContains(landingPage, 'aria-label="Nächstes Projekt"', 'Landing next project arrow label is missing.');
assert(countMatches(landingPage, /<button[^>]*class="carousel-arrow/g) === 2, 'Landing carousel controls should render as buttons.');
assert(countMatches(landingPage, /<button[^>]*class="carousel-arrow[^>]*disabled=""/g) === 2, 'Landing carousel controls should stay disabled while only one real project is available.');
assertContains(landingPage, 'data-project-carousel="true"', 'Landing projects carousel should render through the reusable project carousel component.');
assertContains(landingPage, 'aria-live="polite" class="project-carousel"', 'Landing projects carousel should announce project changes when more real projects are configured.');
assert(countMatches(landingPage, /class="project-card project-card--side"/g) === 2, 'Landing projects section should render both side placeholder cards from the Pencil hierarchy.');
assert(countMatches(landingPage, /class="project-card__skeleton"/g) === 2, 'Landing project side cards should render two skeleton structures.');
assertContains(landingPage, 'class="project-card project-card--featured project-card--linkable"', 'Landing projects section featured Hoshi card is missing.');
assertContains(landingPage, 'class="button button--text project-card__link"', 'Landing featured Hoshi project CTA should use the arrow link class.');
assertContains(landingPage, 'href="/de/games/hoshi"', 'Landing featured Hoshi project should link to the localized Hoshi page.');
assert(countMatches(landingPage, /<details class="faq-item">/g) === 5, 'Landing FAQ should render all questions as expandable details elements.');
assertAppearsInOrder(
  landingPage,
  ['class="skip-link"', '<header class="site-header', '<main class="page page--yakuma" id="main-content">'],
  'Landing page skip/header/main order is wrong.',
);
assert(
  landingSchemaNodes.some((node) => node.name === 'Yakuma' && node.url === `${siteUrl}/de`),
  'Landing Organization schema has the wrong name or URL.',
);

const englishLandingPage = readDist('/en');
assert(!englishLandingPage.includes('href="/en/#'), 'English landing page should not render root anchor links with a trailing slash.');
assertContains(englishLandingPage, 'aria-label="Open navigation"', 'English landing page mobile menu label is missing.');
assertContains(englishLandingPage, 'aria-label="Mobile main navigation"', 'English landing page mobile navigation label is missing.');
assertContains(englishLandingPage, 'aria-current="page"', 'English landing page active language marker is missing.');
assertContains(englishLandingPage, 'aria-label="Previous project"', 'English previous project arrow label is missing.');
assertContains(englishLandingPage, 'aria-label="Next project"', 'English next project arrow label is missing.');

const englishHoshiPage = readDist('/en/games/hoshi');
if (hoshiMediaLinks.trailer) {
  assertContains(englishHoshiPage, `href="${hoshiMediaLinks.trailer}"`, 'English Hoshi page should render the configured trailer URL.');
} else {
  assertContains(englishHoshiPage, 'href="/en/games/hoshi#trailer"', 'English Hoshi trailer CTA should target the trailer placeholder.');
  assertContains(englishHoshiPage, 'aria-label="Trailer pending"', 'English Hoshi trailer pending label is missing.');
}
assertContains(englishHoshiPage, 'alt="Hoshi community feed iPhone mockup"', 'English Hoshi community mockup alt text is missing.');
if (hoshiSocialLinks.instagram) {
  assertContains(englishHoshiPage, `href="${hoshiSocialLinks.instagram}"`, 'English Hoshi page should render the configured Instagram URL.');
} else {
  assertContains(englishHoshiPage, 'aria-label="INSTAGRAM - Profile link pending"', 'English Hoshi social pending label is missing.');
}

const germanNotFoundPage = readDist('/de/404');
assertContains(germanNotFoundPage, '<title data-rh="true">SEITE NICHT GEFUNDEN | Yakuma</title>', 'German 404 title is missing.');
assertContains(germanNotFoundPage, 'name="robots" content="noindex, nofollow"', 'German 404 page should be noindexed.');
assertContains(germanNotFoundPage, `rel="canonical" href="${siteUrl}/de/404"`, 'German 404 canonical is missing.');
assert(!germanNotFoundPage.includes('rel="alternate"'), 'German 404 page should not emit hreflang alternates.');
assert(!germanNotFoundPage.includes('property="og:locale:alternate"'), 'German 404 page should not emit Open Graph locale alternates.');
assertContains(germanNotFoundPage, 'Zurück zu Yakuma', 'German 404 home link copy is missing.');

const staticHostNotFoundPage = readDist('/404');
assert(
  staticHostNotFoundPage === germanNotFoundPage,
  'Static host fallback 404.html should mirror the German localized 404 page.',
);

const englishNotFoundPage = readDist('/en/404');
assertContains(englishNotFoundPage, '<title data-rh="true">PAGE NOT FOUND | Yakuma</title>', 'English 404 title is missing.');
assertContains(englishNotFoundPage, 'name="robots" content="noindex, nofollow"', 'English 404 page should be noindexed.');
assertContains(englishNotFoundPage, `rel="canonical" href="${siteUrl}/en/404"`, 'English 404 canonical is missing.');
assert(!englishNotFoundPage.includes('rel="alternate"'), 'English 404 page should not emit hreflang alternates.');
assert(!englishNotFoundPage.includes('property="og:locale:alternate"'), 'English 404 page should not emit Open Graph locale alternates.');
assertContains(englishNotFoundPage, 'Back to Yakuma', 'English 404 home link copy is missing.');

const expectedServiceNames = {
  'software-engineering': 'SOFTWARE ENGINEERING',
  'game-design': 'GAME DESIGN',
  'interactive-product-design': 'INTERACTIVE PRODUCT DESIGN',
};
const expectedServiceHeroKickers = {
  'software-engineering': 'DEVELOPMENT',
  'game-design': 'PLAY SYSTEMS',
  'interactive-product-design': 'PRODUCT FLOWS',
};

for (const serviceId of serviceIds) {
  const serviceRoute = `/de/services/${serviceId}`;
  const servicePage = readDist(serviceRoute);
  const serviceSchemaNodes = assertSchemaType(servicePage, serviceRoute, 'Service');
  assertSchemaUrlsAreAbsolute(serviceSchemaNodes, serviceRoute);
  assertFaqSchema(serviceSchemaNodes, serviceRoute, 5);
  assertContains(servicePage, expectedServiceHeroKickers[serviceId], `${serviceRoute} descriptive hero kicker is missing.`);
  assert(!servicePage.includes('YAKUMA.DE/SERVICES/'), `${serviceRoute} should not render route URLs as service hero kickers.`);
  assertContains(servicePage, 'LEISTUNGSUMFANG', `${serviceRoute} German service detail kicker is missing.`);
  assertContains(servicePage, 'HÄUFIGE FRAGEN', `${serviceRoute} German service FAQ title is missing.`);
  assert(!servicePage.includes('WHAT THIS COVERS'), `${serviceRoute} should not render the English detail kicker.`);
  assert(!servicePage.includes('COMMON QUESTIONS'), `${serviceRoute} should not render the English FAQ title.`);
  assertContains(
    servicePage,
    `href="${siteUrl}/en/services/${serviceId}" hreflang="en"`,
    `${serviceRoute} English hreflang is missing.`,
  );
  assertContains(
    servicePage,
    `property="og:image:alt" content="Editoriales Yakuma-Visual für ${expectedServiceNames[serviceId]}"`,
    `${serviceRoute} Open Graph image alt is missing.`,
  );
  assertContains(
    servicePage,
    `property="og:image" content="${siteUrl}/assets/service-${serviceId.replace('interactive-product-design', 'interactive').replace('software-engineering', 'software').replace('game-design', 'game')}-hero-placeholder`,
    `${serviceRoute} should use its dedicated Pencil service hero image.`,
  );
  assertContains(
    servicePage,
    `name="twitter:image:alt" content="Editoriales Yakuma-Visual für ${expectedServiceNames[serviceId]}"`,
    `${serviceRoute} Twitter image alt is missing.`,
  );
  assertContains(
    servicePage,
    `alt="Editoriales Yakuma-Visual für ${expectedServiceNames[serviceId]}"`,
    `${serviceRoute} service hero visual alt text is missing.`,
  );
  assertContains(
    servicePage,
    `fetchpriority="high" loading="eager" src="/assets/service-${serviceId.replace('interactive-product-design', 'interactive').replace('software-engineering', 'software').replace('game-design', 'game')}-hero-placeholder`,
    `${serviceRoute} service hero image should load eagerly with high fetch priority.`,
  );
  assert(
    serviceSchemaNodes.some(
      (node) =>
        node.name === expectedServiceNames[serviceId] &&
        node.url === `${siteUrl}${serviceRoute}` &&
        node.provider?.name === 'Yakuma',
    ),
    `${serviceRoute} Service schema has the wrong name, URL, or provider.`,
  );

  const englishServiceRoute = `/en/services/${serviceId}`;
  const englishServicePage = readDist(englishServiceRoute);
  assertContains(englishServicePage, 'WHAT THIS COVERS', `${englishServiceRoute} English service detail kicker is missing.`);
  assertContains(englishServicePage, 'COMMON QUESTIONS', `${englishServiceRoute} English service FAQ title is missing.`);
}

assertAppearsInOrder(
  hoshiPage,
  ['class="skip-link"', '<header class="site-header', '<main class="page page--hoshi" id="main-content">'],
  'Hoshi page skip/header/main order is wrong.',
);

const realHoshiLegal = readDist('/de/games/hoshi/legal/privacy-policy');
assertContains(realHoshiLegal, '<title data-rh="true">DATENSCHUTZERKLÄRUNG | Yakuma</title>', 'German Hoshi privacy title is missing from static head.');
assertContains(realHoshiLegal, 'DATENSCHUTZERKLÄRUNG für Hoshi: Star Sudoku.', 'German Hoshi privacy description is not localized.');
assertContains(realHoshiLegal, 'class="legal-hero__description"', 'German Hoshi legal hero description is missing.');
assertContains(realHoshiLegal, 'Wie Hoshi lokale App-Daten', 'German Hoshi legal hero should explain the document scope.');
assert(!realHoshiLegal.includes('name="robots"'), 'Provided German Hoshi privacy policy should not be noindexed.');
assert(!realHoshiLegal.includes('rel="alternate"'), 'German Hoshi privacy policy should not emit hreflang alternates while English legal text is pending.');
assert(!realHoshiLegal.includes('property="og:locale:alternate"'), 'German Hoshi privacy policy should not emit Open Graph locale alternates while English legal text is pending.');
assert(!realHoshiLegal.includes(`${siteUrl}/hoshi/`), 'German Hoshi privacy policy still contains a legacy /hoshi URL.');
assert(!realHoshiLegal.includes(`${siteUrl}/hoshi/legal-notice`), 'German Hoshi privacy policy still contains a legacy legal notice URL.');

for (const route of [
  '/de/games/hoshi/legal/imprint',
  '/de/games/hoshi/legal/privacy-policy',
  '/de/games/hoshi/legal/terms-of-service',
]) {
  const html = readDist(route);
  assert(
    !html.includes(`<a href="${siteUrl}`),
    `${route} should render same-origin legal markdown URLs as internal links.`,
  );
}

const realHoshiImprint = readDist('/de/games/hoshi/legal/imprint');
assertContains(realHoshiImprint, 'href="/de"', 'German Hoshi imprint should render the Yakuma homepage as a localized internal link.');
assert(!realHoshiImprint.includes('href="/"'), 'German Hoshi imprint should not link to the non-localized root route.');
assertContains(realHoshiImprint, 'href="/de/games/hoshi/legal/privacy-policy"', 'German Hoshi imprint should link internally to privacy policy.');
assertContains(realHoshiImprint, 'href="/de/games/hoshi/legal/terms-of-service"', 'German Hoshi imprint should link internally to terms of service.');
assertContains(realHoshiImprint, 'class="legal-link-group"', 'German Hoshi imprint should render the scoped legal document navigation.');
assertContains(realHoshiImprint, 'aria-label="Weitere rechtliche Dokumente"', 'German Hoshi legal navigation aria label is missing.');
assert(
  countMatches(realHoshiImprint, /class="legal-link-group__links"[^>]*>[\s\S]*?href="\/de\/games\/hoshi\/legal\//g) === 1,
  'German Hoshi legal navigation should render Hoshi-scoped legal links.',
);
assert(
  countMatches(realHoshiImprint, /href="\/de\/games\/hoshi\/legal\/(?:privacy-policy|imprint|terms-of-service)"/g) >= 3,
  'German Hoshi legal navigation should include all Hoshi legal document routes.',
);
assert(
  /aria-current="page"[^>]*href="\/de\/games\/hoshi\/legal\/imprint"|href="\/de\/games\/hoshi\/legal\/imprint"[^>]*aria-current="page"/.test(
    realHoshiImprint,
  ),
  'German Hoshi legal navigation should mark the active imprint document.',
);

const realHoshiTerms = readDist('/de/games/hoshi/legal/terms-of-service');
assertContains(realHoshiTerms, 'href="/de/games/hoshi/legal/imprint"', 'German Hoshi terms should link internally to imprint.');
assertContains(realHoshiTerms, 'href="/de/games/hoshi/legal/privacy-policy"', 'German Hoshi terms should link internally to privacy policy.');
assert(
  /aria-current="page"[^>]*href="\/de\/games\/hoshi\/legal\/terms-of-service"|href="\/de\/games\/hoshi\/legal\/terms-of-service"[^>]*aria-current="page"/.test(
    realHoshiTerms,
  ),
  'German Hoshi legal navigation should mark the active terms document.',
);

for (const [route, expectedTitle, expectedDescription] of [
  [
    '/de/games/hoshi/download',
    'Hoshi: Star Sudoku herunterladen | Yakuma',
    'Lade Hoshi: Star Sudoku für iOS oder Android herunter.',
  ],
  [
    '/en/games/hoshi/download',
    'Download Hoshi: Star Sudoku | Yakuma',
    'Download Hoshi: Star Sudoku for iOS or Android.',
  ],
]) {
  const downloadPage = readDist(route);
  assertContains(downloadPage, `<title data-rh="true">${expectedTitle}</title>`, `Download page title is missing from ${route}.`);
  assertContains(downloadPage, `property="og:title" content="${expectedTitle}"`, `Download Open Graph title is missing from ${route}.`);
  assertContains(downloadPage, expectedDescription, `Download page description is missing from ${route}.`);
  assertContains(downloadPage, 'property="og:image"', `Download Open Graph image is missing from ${route}.`);
  assertContains(downloadPage, 'name="twitter:image"', `Download Twitter image is missing from ${route}.`);
  assertContains(downloadPage, 'Hoshi: Star Sudoku', `Download page fallback copy is missing from ${route}.`);
  assert(!downloadPage.includes('http-equiv="refresh"'), `Download page should not use a global meta refresh in ${route}.`);
  assertSchemaType(downloadPage, route, 'WebPage');
  assertSchemaType(downloadPage, route, 'MobileApplication');
}

const pendingHoshiLegal = readDist('/en/games/hoshi/legal/privacy-policy');
assertContains(pendingHoshiLegal, 'Legal document pending', 'Pending English Hoshi privacy placeholder copy is missing.');
assertContains(pendingHoshiLegal, 'How Hoshi handles local app data', 'Pending English Hoshi legal page should still render the scoped hero description.');
assert(!pendingHoshiLegal.includes('rel="alternate"'), 'Pending Hoshi legal pages should not emit hreflang alternates.');
assert(!pendingHoshiLegal.includes('property="og:locale:alternate"'), 'Pending Hoshi legal pages should not emit Open Graph locale alternates.');

const pendingYakumaLegal = readDist('/de/legal/imprint');
assertContains(pendingYakumaLegal, 'Rechtliches Dokument ausstehend', 'Pending German Yakuma legal placeholder copy is missing.');
assertContains(pendingYakumaLegal, 'Anbieterkennzeichnung und verantwortliche Kontaktdaten', 'Pending German Yakuma legal page should render the Yakuma-scoped hero description.');
assert(!pendingYakumaLegal.includes('rel="alternate"'), 'Pending Yakuma legal pages should not emit hreflang alternates.');
assert(!pendingYakumaLegal.includes('property="og:locale:alternate"'), 'Pending Yakuma legal pages should not emit Open Graph locale alternates.');
assertContains(pendingYakumaLegal, 'class="legal-link-group"', 'Pending Yakuma legal page should render the scoped legal document navigation.');
assertContains(pendingYakumaLegal, 'href="/de/legal/privacy-policy"', 'Pending Yakuma legal navigation should include Yakuma privacy policy.');
assertContains(pendingYakumaLegal, 'href="/de/legal/imprint"', 'Pending Yakuma legal navigation should include Yakuma imprint.');
assert(!pendingYakumaLegal.includes('href="/de/games/hoshi/legal/terms-of-service"'), 'Yakuma legal navigation should not include Hoshi terms.');
assert(
  /aria-current="page"[^>]*href="\/de\/legal\/imprint"|href="\/de\/legal\/imprint"[^>]*aria-current="page"/.test(
    pendingYakumaLegal,
  ),
  'Pending Yakuma legal navigation should mark the active imprint document.',
);

for (const route of ['/de', '/en']) {
  const html = readDist(route);
  assertContains(html, '<form action="https://api.web3forms.com/submit" class="contact-form" method="post">', `Contact form Web3Forms action is missing from ${route}.`);
  assertContains(html, 'name="access_key" type="hidden" value="c5f69042-2b4c-4ad1-b00b-7157f85add2f"', `Contact form Web3Forms access key is missing from ${route}.`);
  assertContains(html, 'class="contact-form__honeypot" name="botcheck"', `Contact form honeypot field is missing from ${route}.`);
  assertContains(html, 'class="contact-form__captcha"', `Contact form hCaptcha mount point is missing from ${route}.`);
  assertContains(html, 'aria-live="polite" class="contact-form__status contact-form__status--idle" role="status"', `Contact form live status is missing from ${route}.`);
  for (const fieldName of ['name', 'email', 'project', 'message']) {
    assertContains(html, `name="${fieldName}"`, `Contact form field ${fieldName} is missing from ${route}.`);
  }
  assertContains(html, 'type="email"', `Contact form email input type is missing from ${route}.`);
  assertContains(html, 'autocomplete="name"', `Contact form name autocomplete is missing from ${route}.`);
  assertContains(html, 'autocomplete="email"', `Contact form email autocomplete is missing from ${route}.`);
  assertContains(html, 'inputmode="email"', `Contact form email input mode is missing from ${route}.`);
  assertContains(html, 'autocomplete="organization-title"', `Contact form project autocomplete is missing from ${route}.`);
  assertContains(html, 'autocomplete="off"', `Contact form message autocomplete is missing from ${route}.`);
  assertContains(html, 'type="submit"', `Contact form submit button is missing from ${route}.`);
}

const contactFormSource = readFileSync(resolve(rootDir, 'src', 'components', 'molecules', 'ContactForm.jsx'), 'utf8');
const contactConfigSource = readFileSync(resolve(rootDir, 'src', 'config', 'contactForm.js'), 'utf8');
assertContains(contactConfigSource, "WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit'", 'Contact form should keep the Web3Forms endpoint in config.');
assertContains(contactConfigSource, "WEB3FORMS_ACCESS_KEY = 'c5f69042-2b4c-4ad1-b00b-7157f85add2f'", 'Contact form should use the provided Web3Forms access key.');
assertContains(contactConfigSource, "HCAPTCHA_SITE_KEY = '50b2fe65-b00b-4b9e-ad62-3ba471098be2'", 'Contact form should use the Web3Forms hCaptcha sitekey that matches their server-side validation.');
assertContains(contactFormSource, "import HCaptcha from '@hcaptcha/react-hcaptcha';", 'Contact form should render hCaptcha through the React component.');
assertContains(contactFormSource, "requestData.set('h-captcha-response', captchaToken)", 'Contact form should include the hCaptcha response token in Web3Forms submissions.');
assertContains(contactFormSource, 'fetch(WEB3FORMS_ENDPOINT', 'Contact form should submit asynchronously to Web3Forms.');
assertContains(contactFormSource, 'captchaRef.current?.resetCaptcha()', 'Contact form should reset hCaptcha after submission attempts.');
assertContains(contactFormSource, "t('contact.subjectPrefix')", 'Contact form should use the localized mail subject prefix.');
assertContains(contactFormSource, "t('contact.statusSending')", 'Contact form should announce active Web3Forms submission.');
assertContains(contactFormSource, "t('contact.statusSuccess')", 'Contact form should announce successful Web3Forms submission.');
assertContains(contactFormSource, "t('contact.statusError')", 'Contact form should announce failed Web3Forms submission.');
assertContains(contactFormSource, 'cleanValue(formData.message)', 'Contact form should trim the generated mail body values.');

const legacyPatterns = [
  /href="\/hoshi/g,
  /to="\/hoshi/g,
  new RegExp(`${escapeRegExp(siteUrl)}/hoshi\\b`, 'g'),
  /ThemeContext/g,
  /theme toggle/gi,
  /lightmode/gi,
  /darkmode/gi,
];

for (const route of renderedRoutes) {
  const html = readDist(route);
  if (route !== '/' && !neutralRouteAliases.some(({ path }) => path === route)) {
    assertContains(html, 'class="skip-link" href="#main-content"', `Skip link is missing from ${route}.`);
    assertContains(html, 'id="main-content"', `Main content target is missing from ${route}.`);
    assertContains(html, '<header class="site-header', `Site header is missing from ${route}.`);
    assertContains(html, '<footer class="site-footer"', `Site footer is missing from ${route}.`);
    assertContains(html, 'class="menu-toggle"', `Mobile menu toggle is missing from ${route}.`);
    assertContains(html, 'aria-controls="site-mobile-navigation"', `Mobile menu control binding is missing from ${route}.`);
    assertContains(html, 'id="site-mobile-navigation"', `Mobile navigation panel is missing from ${route}.`);
    assertContains(html, 'class="language-switcher"', `Language switcher is missing from ${route}.`);
    assertContains(html, 'aria-current="page"', `Active language marker is missing from ${route}.`);
  }
  for (const pattern of legacyPatterns) {
    assert(!pattern.test(html), `Legacy or disallowed pattern ${pattern} found in ${route}.`);
    pattern.lastIndex = 0;
  }
  assert(!html.includes('aria-current="true"'), `Generic aria-current value found in ${route}.`);

  assertInternalTargetsExist(route, html);
  assertBlankTargetsAreSafe(route, html);
}

if (failures.length > 0) {
  console.error(`Build verification failed with ${failures.length} issue(s):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Build verification passed for ${routes.length} localized routes.`);
