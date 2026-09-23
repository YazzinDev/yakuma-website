import { useEffect, useRef, useState } from 'react';
import globeFallback from '../../assets/design/globe-first-frame-desktop.png';
import mobileGlobeFallback from '../../assets/design/globe-first-frame-mobile.png';

export default function HeroGlobe() {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const previewOptions = new URLSearchParams(window.location.search);
    const motionPreview = import.meta.env.DEV && previewOptions.has('previewMotion');
    const reducedPreview = import.meta.env.DEV && previewOptions.has('previewReducedMotion');
    const frozenPreview = import.meta.env.DEV && previewOptions.has('freezeGlobe');
    if (!container || reducedPreview || (window.matchMedia('(prefers-reduced-motion: reduce)').matches && !motionPreview)) return undefined;
    let alive = true;
    let visible = false;
    let scene;
    let initializing = false;
    let contextLost = false;
    let generation = 0;
    const mobileQuery = window.matchMedia('(max-width: 1100px)');

    function disposeScene() {
      scene?.dispose();
      scene = undefined;
      if (alive) setReady(false);
    }

    function startScene() {
      if (!alive || !visible || contextLost || initializing || scene) return;
      initializing = true;
      const currentGeneration = ++generation;
      import('../../graphics/heroGlobeScene.js')
        .then(module => module.createHeroGlobeScene(container, {
          mobile: mobileQuery.matches,
          onReady: () => {
            if (alive && currentGeneration === generation && !contextLost) setReady(true);
          },
        }))
        .then(created => {
          if (!alive || currentGeneration !== generation || contextLost) created.dispose();
          else { scene = created; syncVisibility(); }
        })
        .catch(error => {
          if (alive && currentGeneration === generation) {
            console.error('Hero globe initialization failed', error);
            setReady(false);
          }
        })
        .finally(() => { if (currentGeneration === generation) initializing = false; });
    }
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) startScene();
      scene?.setActive(visible && !document.hidden && !frozenPreview);
    }, { threshold: 0.05 });
    const syncVisibility = () => scene?.setActive(visible && !document.hidden && !frozenPreview);
    const onContextLost = event => {
      if (event.target.tagName !== 'CANVAS') return;
      event.preventDefault();
      contextLost = true;
      generation += 1;
      initializing = false;
      scene?.setActive(false);
      setReady(false);
    };
    const onContextRestored = event => {
      if (event.target.tagName !== 'CANVAS') return;
      contextLost = false;
      generation += 1;
      initializing = false;
      disposeScene();
      startScene();
    };
    const onQualityChange = () => {
      generation += 1;
      initializing = false;
      disposeScene();
      contextLost = false;
      startScene();
    };
    visibility.observe(container);
    document.addEventListener('visibilitychange', syncVisibility);
    container.addEventListener('webglcontextlost', onContextLost, true);
    container.addEventListener('webglcontextrestored', onContextRestored, true);
    mobileQuery.addEventListener('change', onQualityChange);
    return () => {
      alive = false;
      generation += 1;
      visibility.disconnect();
      document.removeEventListener('visibilitychange', syncVisibility);
      container.removeEventListener('webglcontextlost', onContextLost, true);
      container.removeEventListener('webglcontextrestored', onContextRestored, true);
      mobileQuery.removeEventListener('change', onQualityChange);
      disposeScene();
    };
  }, []);

  return <div className={`hero-globe-scene${ready ? ' hero-globe-scene--ready' : ''}`} ref={containerRef}>
    <picture>
      <source media="(max-width: 1100px)" srcSet={mobileGlobeFallback} />
      <img alt="" className="hero-globe-scene__fallback" fetchpriority="high" height="952" src={globeFallback} width="952" />
    </picture>
  </div>;
}
