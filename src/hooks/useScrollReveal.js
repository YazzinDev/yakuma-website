import { useEffect } from 'react';

const revealSelector = [
  'section:not(.landing-hero):not(.hoshi-hero)',
  '.legal-hero',
  '.legal-document',
  '.legal-link-group',
].join(',');

const targetSelector = [
  '.section-kicker',
  'h1',
  'h2',
  'h3',
  'p:not(.section-kicker):not(.account-deletion-steps__text)',
  '.placeholder-image',
  '.project-card',
  '.service-capability',
  '.faq-item',
  '.text-field',
  '.contact-form .button',
  '.news-card',
  '.store-badge',
].join(',');

function getDirectRevealTargets(section) {
  const candidates = Array.from(section.querySelectorAll(targetSelector));

  return candidates.filter((candidate) => {
    const nestedSection = candidate.parentElement?.closest(revealSelector);
    return nestedSection === section;
  });
}

function getRevealOpacity(target) {
  const configuredOpacity = Number.parseFloat(target.dataset.revealOpacity ?? '1');
  return Number.isFinite(configuredOpacity) ? configuredOpacity : 1;
}

export default function useScrollReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return undefined;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let context;
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

      context = gsap.context(() => {
        const sections = Array.from(root.querySelectorAll(revealSelector));

        sections.forEach((section) => {
          const targets = getDirectRevealTargets(section);
          if (targets.length === 0) {
            return;
          }

          const yOffset = prefersReducedMotion ? 28 : 52;
          const revealOpacities = targets.map(getRevealOpacity);

          gsap.set(targets, {
            opacity: 0,
            y: yOffset,
          });

          gsap.to(targets, {
            clearProps: 'opacity,transform',
            duration: prefersReducedMotion ? 0.55 : 0.9,
            ease: 'power3.out',
            opacity: (index) => revealOpacities[index],
            scrollTrigger: {
              once: true,
              start: 'top 84%',
              toggleActions: 'play none none none',
              trigger: section,
            },
            stagger: prefersReducedMotion ? 0.05 : 0.1,
            y: 0,
          });
        });

        ScrollTrigger.refresh();
      }, root);
    }

    setupRevealAnimations();

    return () => {
      isMounted = false;
      context?.revert();
    };
  }, [rootRef]);
}
