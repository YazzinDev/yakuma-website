function isAppleMobileNavigator(navigatorLike) {
  const userAgent = navigatorLike?.userAgent ?? '';
  const platform = navigatorLike?.platform ?? '';
  const hasTouch = Number(navigatorLike?.maxTouchPoints ?? 0) > 1;

  return /iPad|iPhone|iPod/i.test(userAgent) || (platform === 'MacIntel' && hasTouch);
}

export function detectHoshiDownloadPlatform(navigatorLike) {
  if (!navigatorLike) return null;
  if (isAppleMobileNavigator(navigatorLike)) return 'ios';
  if (/Android/i.test(navigatorLike.userAgent ?? '')) return 'android';
  return null;
}

export function resolveHoshiDownloadTarget(
  navigatorLike = typeof navigator === 'undefined' ? null : navigator,
  storeLinks,
) {
  const platform = detectHoshiDownloadPlatform(navigatorLike);
  const storeKey = platform === 'ios' ? 'appStore' : platform === 'android' ? 'googlePlay' : null;
  const url = storeKey ? storeLinks?.[storeKey] : null;

  return platform && url ? { platform, url } : null;
}
