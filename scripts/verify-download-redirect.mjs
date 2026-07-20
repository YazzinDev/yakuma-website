import assert from 'node:assert/strict';
import { detectHoshiDownloadPlatform, resolveHoshiDownloadTarget } from '../src/utils/hoshiDownloadRedirect.js';

const storeLinks = {
  appStore: 'https://apps.apple.com/app/hoshi',
  googlePlay: 'https://play.google.com/store/apps/details?id=de.yakuma.hoshi',
};

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
  resolveHoshiDownloadTarget({ userAgent: 'Android' }, storeLinks),
  { platform: 'android', url: storeLinks.googlePlay },
);
assert.equal(resolveHoshiDownloadTarget({ userAgent: 'Android' }, { appStore: null, googlePlay: null }), null);
assert.equal(resolveHoshiDownloadTarget({ userAgent: 'Windows' }, storeLinks), null);

console.log('Download redirect verification passed.');
