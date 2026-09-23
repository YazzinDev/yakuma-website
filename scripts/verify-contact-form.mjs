import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const root = resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const dictionary = JSON.parse(readFileSync(resolve(root, 'src/i18n/locales/en/common.json'), 'utf8'));
const germanDictionary = JSON.parse(readFileSync(resolve(root, 'src/i18n/locales/de/common.json'), 'utf8'));
const result = await build({
  entryPoints: [resolve(root, 'src/components/molecules/ContactForm.jsx')],
  bundle: true,
  format: 'cjs',
  jsx: 'automatic',
  platform: 'node',
  write: false,
  external: ['react'],
  plugins: [{
    name: 'local-contact-test-doubles',
    setup(plugin) {
      plugin.onResolve({ filter: /^@hcaptcha\/react-hcaptcha$/ }, () => ({ path: 'captcha', namespace: 'mock' }));
      plugin.onResolve({ filter: /^react-i18next$/ }, () => ({ path: 'translations', namespace: 'mock' }));
      plugin.onResolve({ filter: /\.css$/ }, () => ({ path: 'empty-css', namespace: 'mock' }));
      plugin.onLoad({ filter: /.*/, namespace: 'mock' }, ({ path }) => {
        if (path === 'empty-css') return { contents: '', loader: 'js' };
        if (path === 'translations') return { loader: 'js', contents: `
          const dictionaries = { en: ${JSON.stringify(dictionary)}, de: ${JSON.stringify(germanDictionary)} };
          export function useTranslation() {
            return { i18n: { resolvedLanguage: globalThis.__contactTestLocale }, t(key) {
              return key.split('.').reduce((value, part) => value?.[part], dictionaries[globalThis.__contactTestLocale]) ?? key;
            } };
          }
        ` };
        return { loader: 'jsx', contents: `
          import React from 'react';
          export default React.forwardRef(function MockCaptcha(props, ref) {
            React.useImperativeHandle(ref, () => ({ resetCaptcha() {}, execute() { return Promise.resolve(); } }));
            return <div className="captcha-mock">
              <button type="button" onClick={() => props.onVerify('mock-token')}>MOCK VERIFY</button>
              <button type="button" onClick={props.onError}>MOCK ERROR</button>
              <button type="button" onClick={props.onExpire}>MOCK EXPIRE</button>
            </div>;
          });
        ` };
      });
    },
  }],
});

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/' });
globalThis.__contactTestLocale = 'en';
const document = dom.window.document;
Object.assign(globalThis, {
  document,
  window: dom.window,
  HTMLElement: dom.window.HTMLElement,
  FormData: dom.window.FormData,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: dom.window.navigator });
dom.window.matchMedia = () => ({ matches: true });
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
let captchaObserver;
class MockIntersectionObserver {
  constructor(callback) { this.callback = callback; captchaObserver = this; }
  observe() {}
  disconnect() {}
  enter() { this.callback([{ isIntersecting: true }]); }
}
dom.window.IntersectionObserver = MockIntersectionObserver;
globalThis.IntersectionObserver = MockIntersectionObserver;
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
const output = { exports: {} };
new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, output, output.exports);
const ContactForm = output.exports.default;
const mounted = createRoot(document.querySelector('#root'));

function status() { return document.querySelector('.contact-form__status').textContent; }
function click(label) {
  [...document.querySelectorAll('button')].find(button => button.textContent.includes(label)).click();
}
function fill(name, value) {
  const control = document.querySelector(`[name="${name}"]`);
  control.value = value;
  require('react-dom/test-utils').Simulate.change(control, { target: { name, value } });
}
function submit() {
  document.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
}

let calls = 0;
let completeRequest;
globalThis.fetch = async (_url, options) => {
  calls += 1;
  assert.equal(options.method, 'POST');
  assert.equal(options.body.get('h-captcha-response'), 'mock-token');
  return new Promise(resolveRequest => { completeRequest = resolveRequest; });
};

await act(async () => { mounted.render(React.createElement(ContactForm, { variant: 'pencil' })); });
await act(async () => { await new Promise(resolveTimer => setTimeout(resolveTimer, 0)); });
assert.equal(document.querySelector('.captcha-mock'), null, 'The captcha must remain unloaded before contact approaches.');
await act(async () => { captchaObserver.enter(); });
await act(async () => { await new Promise(resolveTimer => setTimeout(resolveTimer, 0)); });
assert.ok(document.querySelector('.captcha-mock'), 'The captcha must load when contact approaches.');
await act(async () => {
  for (const [name, value] of Object.entries({ name: 'Test Person', email: 'test@example.invalid', project: 'Local test', message: 'No external message' })) fill(name, value);
});
await act(async () => { submit(); });
assert.equal(calls, 0, 'Missing captcha must never send a request.');
assert.equal(status(), dictionary.contact.statusCaptcha);

await act(async () => { click('MOCK ERROR'); });
assert.equal(status(), dictionary.contact.statusCaptchaUnavailable);
assert.equal(calls, 0, 'Captcha load error must not send a request.');
globalThis.__contactTestLocale = 'de';
await act(async () => { mounted.render(React.createElement(ContactForm, { variant: 'pencil' })); });
assert.equal(status(), germanDictionary.contact.statusCaptchaUnavailable, 'An existing error must follow the active language.');
globalThis.__contactTestLocale = 'en';
await act(async () => { mounted.render(React.createElement(ContactForm, { variant: 'pencil' })); });
assert.equal(status(), dictionary.contact.statusCaptchaUnavailable);

await act(async () => { click('MOCK VERIFY'); });
assert.equal(status(), '', 'A verified captcha clears the stale widget error.');
await act(async () => { click('MOCK EXPIRE'); submit(); });
assert.equal(calls, 0, 'Expired captcha must not send a request.');
assert.equal(status(), dictionary.contact.statusCaptcha);

await act(async () => { click('MOCK VERIFY'); });
await act(async () => { submit(); submit(); });
assert.equal(calls, 1, 'Rapid duplicate submits must create one request.');
assert.equal(document.querySelector('form').getAttribute('aria-busy'), 'true');
assert.equal(document.querySelector('button[type="submit"]').disabled, true);

await act(async () => { completeRequest({ ok: false, json: async () => ({ success: false }) }); });
assert.equal(status(), dictionary.contact.statusError);
assert.equal(document.querySelector('button[type="submit"]').disabled, false);
await act(async () => { submit(); });
assert.equal(calls, 1, 'Failed request must clear the old captcha token.');

await act(async () => { click('MOCK VERIFY'); });
await act(async () => { submit(); });
assert.equal(calls, 2, 'Retry with a new captcha token must be possible.');
await act(async () => { completeRequest({ ok: true, json: async () => ({ success: true }) }); });
assert.equal(status(), dictionary.contact.statusSuccess);
assert.equal(document.querySelector('[name="message"]').value, '');

await act(async () => { mounted.unmount(); });
dom.window.close();
console.log('Contact form local mock: missing/error/expired captcha, locale switch, duplicate submit, failed request, retry and success passed. No external request sent.');
