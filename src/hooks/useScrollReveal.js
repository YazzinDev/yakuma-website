import { useEffect } from 'react';

const revealSelector = [
  '.yakuma-about',
  '.yakuma-projects',
  '.yakuma-faq',
  '.yakuma-contact',
  '.hoshi-about',
  '.hoshi-how-to',
  '.faq-section--hoshi',
].join(',');

const targetSelector = [
  '.section-kicker',
  'h1',
  'h2',
  'h3',
  'p:not(.section-kicker):not(.account-deletion-steps__text)',
  '.placeholder-image',
  '.project-card',
  '.faq-item',
  '.text-field',
  '.contact-form .button',
  '.news-card',
  '.store-badge',
  '.capability-window',
  '.garment-label',
  '.featured-project-window',
  '.project-annotation',
  '.hoshi-about__banner',
  '.hoshi-about__triangle',
].join(',');

function getDirectRevealTargets(section) {
  const candidates = Array.from(section.querySelectorAll(targetSelector));
  const candidateSet = new Set(candidates);

  return candidates.filter((candidate) => {
    const nestedSection = candidate.parentElement?.closest(revealSelector);
    if (nestedSection !== section) return false;
    let ancestor = candidate.parentElement;
    while (ancestor && ancestor !== section) {
      if (candidateSet.has(ancestor)) return false;
      ancestor = ancestor.parentElement;
    }
    return true;
  });
}

function getRevealOpacity(target) {
  const configuredOpacity = Number.parseFloat(target.dataset.revealOpacity ?? '1');
  return Number.isFinite(configuredOpacity) ? configuredOpacity : 1;
}

export default function useScrollReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    const reducedPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).has('previewReducedMotion');
    if (!root || reducedPreview) {
      return undefined;
    }

    let media;
    let isMounted = true;

    async function setupRevealAnimations() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);

      if (!isMounted || !rootRef.current) {
        return;
      }

      gsap.registerPlugin(ScrollTrigger);

      // matchMedia reverts the animations when the preference changes at runtime.
      // Reduced motion retains the visible server-rendered end state.
      media = gsap.matchMedia();
      const motionPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).has('previewMotion');
      media.add(motionPreview ? 'all' : '(prefers-reduced-motion: no-preference)', () => {
        const sections = Array.from(root.querySelectorAll(revealSelector));

        sections.forEach((section) => {
          const targets = getDirectRevealTargets(section);
          if (targets.length === 0) {
            return;
          }

          const yOffset = root.className.includes('hoshi') ? 20 : 40;
          const revealOpacities = targets.map(getRevealOpacity);

          gsap.set(targets, {
            opacity: 0,
            y: yOffset,
          });

          gsap.to(targets, {
            clearProps: 'opacity,transform',
            duration: 0.75,
            ease: 'power3.out',
            opacity: (index) => revealOpacities[index],
            scrollTrigger: {
              once: true,
              start: 'top 84%',
              toggleActions: 'play none none none',
              trigger: section,
            },
            stagger: 0.08,
            y: 0,
          });
        });

        let refreshFrame = 0;
        const scheduleRefresh = () => {
          cancelAnimationFrame(refreshFrame);
          refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
        };
        const resize = new ResizeObserver(scheduleRefresh);
        resize.observe(root);
        root.addEventListener('load', scheduleRefresh, true);
        document.fonts.ready.then(() => { if (isMounted) scheduleRefresh(); });
        scheduleRefresh();
        return () => {
          cancelAnimationFrame(refreshFrame);
          resize.disconnect();
          root.removeEventListener('load', scheduleRefresh, true);
        };
      }, root);
    }

    setupRevealAnimations();

    return () => {
      isMounted = false;
      media?.revert();
    };
  }, [rootRef]);
}
