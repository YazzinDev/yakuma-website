import { useEffect } from 'react';

function getTrackableSections() {
  const nodes = Array.from(document.querySelectorAll('main section[id], main .section-anchor[id]'));
  const seen = new Set();

  return nodes
    .map((node) => {
      const id = node.id;
      const element =
        node.classList.contains('section-anchor') && node.nextElementSibling instanceof HTMLElement
          ? node.nextElementSibling
          : node;

      if (!id || seen.has(id) || element.getClientRects().length === 0) {
        return null;
      }

      seen.add(id);
      return { element, id };
    })
    .filter(Boolean);
}

function getActiveSectionId(sections) {
  const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height ?? 0;
  const probeY = headerHeight + window.innerHeight * 0.32;

  const containingSection = sections.find(({ element }) => {
    const rect = element.getBoundingClientRect();
    return rect.top <= probeY && rect.bottom > probeY;
  });

  if (containingSection) {
    return containingSection.id;
  }

  return sections.reduce((closest, section) => {
    const rect = section.element.getBoundingClientRect();
    const distance = Math.abs(rect.top - probeY);
    return distance < closest.distance ? { distance, id: section.id } : closest;
  }, { distance: Number.POSITIVE_INFINITY, id: '' }).id;
}

function replaceHash(id) {
  const hash = `#${encodeURIComponent(id)}`;

  if (window.location.hash === hash) {
    return;
  }

  window.history.replaceState(
    window.history.state,
    '',
    `${window.location.pathname}${window.location.search}${hash}`,
  );
}

export default function useSectionHashSync(pathname) {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let frameId = 0;
    let initialTimer = 0;

    const updateActiveHash = () => {
      frameId = 0;
      const sections = getTrackableSections();

      if (sections.length === 0) {
        return;
      }

      const activeSectionId = getActiveSectionId(sections);

      if (activeSectionId) {
        replaceHash(activeSectionId);
      }
    };

    const scheduleUpdate = () => {
      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(updateActiveHash);
    };

    initialTimer = window.setTimeout(scheduleUpdate, 180);
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      window.clearTimeout(initialTimer);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [pathname]);
}
