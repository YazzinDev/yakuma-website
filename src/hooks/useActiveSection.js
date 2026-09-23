import { useEffect, useState } from 'react';
import { selectActiveSection } from './activeSection';

export default function useActiveSection(pathname) {
  const [selection, setSelection] = useState({ pathname: '', id: '' });
  useEffect(() => {
    let frame = 0;
    const main = document.querySelector('main');
    const update = () => {
      frame = 0;
      const seen = new Set();
      const sections = [...document.querySelectorAll('main section[id], main .section-anchor[id]')]
        .flatMap(node => {
          const element = node.classList.contains('section-anchor') ? node.nextElementSibling : node;
          if (!element?.getClientRects().length || seen.has(node.id)) return [];
          seen.add(node.id);
          const { top, bottom } = element.getBoundingClientRect();
          return [{ id: node.id, top, bottom }];
        }).sort((a, b) => a.top - b.top);
      const header = document.querySelector('.site-header');
      const activationY = (header?.getBoundingClientRect().bottom ?? 0) + 1;
      const id = selectActiveSection(sections, {
        activationY, viewportHeight: window.innerHeight,
        atBottom: window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2,
      });
      setSelection(current => current.pathname === pathname && current.id === id ? current : { pathname, id });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const resizeObserver = new ResizeObserver(schedule);
    if (main) resizeObserver.observe(main);
    const header = document.querySelector('.site-header');
    if (header) resizeObserver.observe(header);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('hashchange', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('hashchange', schedule);
    };
  }, [pathname]);
  return selection.pathname === pathname ? selection.id : '';
}
