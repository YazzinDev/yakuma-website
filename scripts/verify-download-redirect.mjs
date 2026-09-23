import assert from 'node:assert/strict';
import { hoshiStoreLinks } from '../src/config/storeLinks.js';
import { detectHoshiDownloadPlatform, resolveHoshiDownloadTarget } from '../src/utils/hoshiDownloadRedirect.js';

assert.equal(hoshiStoreLinks.googlePlay, 'https://play.google.com/store/apps/details?id=de.yakuma.hoshi');
assert.equal(hoshiStoreLinks.appStore, null);

assert.equal(
  detectHoshiDownloadPlatform({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' }),
  'ios',
);
assert.equal(detectHoshiDownloadPlatform({ userAgent: 'Mozilla/5.0 (Linux; Android 15)' }), 'android');
assert.equal(detectHoshiDownloadPlatform({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }), null);
assert.equal(
  detectHoshiDownloadPlatform({ platform: 'MacIntel', maxTouchPoints: 5, userAgent: 'Mozilla/5.0' }),
  'ios',
);

assert.deepEqual(
  resolveHoshiDownloadTarget({ userAgent: 'Android' }, hoshiStoreLinks),
  { platform: 'android', url: hoshiStoreLinks.googlePlay },
);
assert.equal(resolveHoshiDownloadTarget({ userAgent: 'iPhone' }, hoshiStoreLinks), null);
assert.equal(resolveHoshiDownloadTarget({ userAgent: 'Windows' }, hoshiStoreLinks), null);

console.log('Download redirect verification passed.');
