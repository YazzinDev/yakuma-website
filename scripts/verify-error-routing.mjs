import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { getErrorRoute } from '../src/routes/errorRoutes.js';

const cases = [
  ['/de/missing/nested', '/de/404'],
  ['/en/missing', '/en/404'],
  ['/de/games/hoshi/missing/nested', '/de/games/hoshi/404'],
  ['/en/games/hoshi/legal/missing', '/en/games/hoshi/404'],
  ['/games/hoshi/missing', '/en/games/hoshi/404'],
  ['/fr/games/hoshi/missing', '/en/games/hoshi/404'],
  ['/hoshi/missing', '/en/games/hoshi/404'],
  ['/de/hoshi/missing', '/de/games/hoshi/404'],
  ['/de/games/hoshix/missing', '/de/404'],
  ['/de/projects/games/hoshi/missing', '/de/404'],
  ['/unknown', '/en/404'],
  ['/404.html', '/en/404'],
];
const root = resolve(import.meta.dirname, '..');
const fallback = readFileSync(resolve(root, 'dist/404.html'), 'utf8');
const script = fallback.match(/<head><script>([\s\S]*?)<\/script>/)?.[1];
assert(script, 'Static fallback must include the early routing script.');
for (const [pathname, expected] of cases) {
  assert.equal(getErrorRoute(pathname), expected, pathname);
  let destination;
  runInNewContext(script, { location: { pathname, replace: value => { destination = value; } } });
  assert.equal(destination, expected, `Static fallback for ${pathname}`);
}
for (const pathname of ['/de/404', '/en/404', '/de/games/hoshi/404', '/en/games/hoshi/404']) {
  runInNewContext(script, { location: { pathname, replace: () => assert.fail('Recovery route must not redirect to itself.') } });
}
console.log('Branded client/static error routing and redirect loop checks passed.');
