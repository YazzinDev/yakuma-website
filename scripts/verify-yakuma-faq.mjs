import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const decode = text => text.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#x27;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');

for (const language of ['de', 'en']) {
  const html = readFileSync(resolve(root, `dist/${language}.html`), 'utf8');
  const items = JSON.parse(readFileSync(resolve(root, `src/i18n/locales/${language}/landing.json`), 'utf8')).faq.items;
  const section = html.match(/<section[^>]*id="faq"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert(section, `${language}: FAQ must be server rendered.`);
  const buttons = [...section.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)];
  assert.equal(buttons.length, items.length, `${language}: every question needs an operable control.`);
  assert.equal(buttons.filter(match => match[1].includes('aria-expanded="true"')).length, 1, `${language}: exactly the first answer starts open.`);
  for (const [index, button] of buttons.entries()) {
    const attributes = button[1];
    const target = attributes.match(/aria-controls="([^"]+)"/)?.[1];
    const label = attributes.match(/\bid="([^"]+)"/)?.[1];
    assert(target && label, `${language}: question ${index + 1} needs a labelled answer binding.`);
    assert(attributes.includes('type="button"'), `${language}: question controls must not submit a surrounding form.`);
    const answerOpening = [...section.matchAll(/<div\b([^>]*)>/g)].find(match => match[1].includes(`id="${target}"`))?.[1];
    assert(answerOpening?.includes(`aria-labelledby="${label}"`), `${language}: question ${index + 1} must label its own region.`);
    assert.equal(/\bhidden(?:=|\s|$)/.test(answerOpening), index !== 0, `${language}: initial visibility must match expanded state.`);
    assert(decode(button[2].replace(/<[^>]*>/g, '')).includes(items[index].question), `${language}: question copy missing.`);
    assert(decode(section).includes(items[index].answer), `${language}: answer content must exist before hydration.`);
  }
  const schemas = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .flatMap(match => { const data = JSON.parse(match[1]); return data['@graph'] ?? [data]; });
  const faq = schemas.find(node => node['@type'] === 'FAQPage');
  assert(faq, `${language}: FAQPage structured data missing.`);
  assert.deepEqual(faq.mainEntity.map(question => ({ question: question.name, answer: question.acceptedAnswer.text })), items,
    `${language}: structured data and visible FAQ must use identical content.`);
}
console.log('Yakuma FAQ SSG content, accessible bindings and JSON-LD parity passed. Browser interaction checks remain separate.');
