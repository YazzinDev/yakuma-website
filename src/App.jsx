import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import useSectionHashSync from './hooks/useSectionHashSync';

export default function App() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      return;
    }

    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    target?.scrollIntoView({ block: 'start' });
  }, [hash, pathname]);

  useSectionHashSync(pathname);

  return <Outlet />;
}
