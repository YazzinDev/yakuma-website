import { useEffect, useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import i18n, { normalizeLanguage } from './i18n/config';

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export default function App() {
  const { hash, pathname } = useLocation();
  const language = normalizeLanguage(pathname.split('/')[1]);

  useBrowserLayoutEffect(() => {
    if (i18n.language !== language) void i18n.changeLanguage(language);
    document.documentElement.lang = language;
  }, [language]);

  useBrowserLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      return;
    }

    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    let cancelled = false;
    let frame = 0;
    const align = () => {
      if (cancelled) return;
      document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'instant' });
    };
    // Locale render effects and local font loading can change earlier sections'
    // heights. Re-align the explicit target after both settle, unless the user
    // has already started navigating manually.
    const schedule = () => {
      if (cancelled) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { frame = requestAnimationFrame(align); });
    };
    const cancel = () => { cancelled = true; cancelAnimationFrame(frame); };
    const main = document.querySelector('main');
    const contentResize = new ResizeObserver(schedule);
    if (main) {
      contentResize.observe(main);
      main.querySelectorAll('section[id]').forEach(section => contentResize.observe(section));
    }
    align();
    schedule();
    document.fonts?.ready.then(schedule);
    window.addEventListener('wheel', cancel, { passive: true });
    window.addEventListener('touchstart', cancel, { passive: true });
    window.addEventListener('pointerdown', cancel, { passive: true });
    window.addEventListener('keydown', cancel);
    return () => {
      cancel();
      contentResize.disconnect();
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchstart', cancel);
      window.removeEventListener('pointerdown', cancel);
      window.removeEventListener('keydown', cancel);
    };
  }, [hash, pathname]);

  return <Outlet />;
}
