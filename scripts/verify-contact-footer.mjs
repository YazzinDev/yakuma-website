import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildStaticRoutes } from '../src/routes/localizedPaths.js';

const root = resolve(import.meta.dirname, '..');
for (const route of buildStaticRoutes().filter(route => /^\/(de|en)(\/|$)/.test(route))) {
  const html = readFileSync(resolve(root, `dist${route}.html`), 'utf8');
  const footers = [...html.matchAll(/<footer\b[^>]*>([\s\S]*?)<\/footer>/g)];
  assert.equal(footers.length, 1, `${route}: exactly one shared footer is required.`);
  assert(html.indexOf('</main>') < html.indexOf('<footer'), `${route}: footer must be separate from page sections.`);
  const footer = footers[0][0];
  const language = route.split('/')[1];
  const scope = route.includes('/games/hoshi') ? 'hoshi' : 'yakuma';
  const base = scope === 'hoshi' ? `/${language}/games/hoshi/legal` : `/${language}/legal`;
  assert(footer.includes(`site-footer--${scope}`), `${route}: wrong footer theme.`);
  assert(footer.includes(`href="/${language}"`), `${route}: shared brand must link to localized Yakuma home.`);
  const links = [...footer.matchAll(/href="([^"]*\/legal\/[^"#]+)"/g)].map(match => match[1]);
  assert.deepEqual(links, ['privacy-policy', 'legal-disclosure', ...(scope === 'hoshi' ? ['terms-of-service'] : [])].map(path => `${base}/${path}`), `${route}: legal links must stay in the current scope and locale.`);
  assert(!/Premium[- ](?:software|Software)/.test(footer), `${route}: obsolete studio claim remains.`);
  assert(footer.includes('YASSIN KUCZMA') && footer.includes('MADE IN GERMANY'), `${route}: required owner/origin copy missing.`);
}
for (const language of ['de', 'en']) {
  const html = readFileSync(resolve(root, `dist/${language}.html`), 'utf8');
  const section = html.match(/<section[^>]*id="contact"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert(section, `${language}: contact section missing.`);
  for (const name of ['name', 'email', 'project', 'message']) {
    const control = [...section.matchAll(/<(?:input|textarea)\b([^>]*)>/g)].find(match => match[1].includes(`name="${name}"`))?.[1];
    assert(control, `${language}: ${name} control missing.`);
    assert(/\brequired(?:=|\s|$)/.test(control), `${language}: ${name} must be required.`);
    const id = control.match(/\bid="([^"]+)"/)?.[1];
    assert(id && section.includes(`for="${id}"`), `${language}: ${name} needs a persistent bound label.`);
  }
  const captchaPosition = section.indexOf('class="contact-form__captcha"');
  const submitPosition = section.indexOf('type="submit"');
  assert(captchaPosition > 0 && captchaPosition < submitPosition, `${language}: captcha must precede submit in DOM/focus order.`);
  assert(section.includes('href="mailto:mail@yakuma.de"'), `${language}: direct contact fallback missing.`);
}
console.log('Localized footer scope, single-footer composition and contact SSG semantics passed. No form request sent.');
