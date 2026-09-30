import { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import CapabilityWindow from '../molecules/CapabilityWindow';

const options = {
  loop: true,
  align: 'center',
  startIndex: 1,
  skipSnaps: true,
  breakpoints: {
    '(min-width: 1101px)': { active: false },
    '(prefers-reduced-motion: reduce)': { duration: 0 },
  },
};
const plugins = [WheelGesturesPlugin({ forceWheelAxis: 'x' })];

export default function CapabilityCarousel({ items, language }) {
  const [viewportRef, carousel] = useEmblaCarousel(options, plugins);
  const [active, setActive] = useState(1);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const media = matchMedia('(max-width: 1100px)');
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!carousel) return;
    const update = () => setActive(carousel.selectedScrollSnap());
    update();
    carousel.on('select', update).on('reInit', update);
    return () => { carousel.off('select', update).off('reInit', update); };
  }, [carousel]);

  const label = language === 'de' ? 'Unsere Disziplinen' : 'Our disciplines';
  const selectedItem = active % items.length;
  function selectItem(index) {
    if (!carousel) return;
    const count = carousel.scrollSnapList().length;
    const current = carousel.selectedScrollSnap();
    const distance = target => Math.min(Math.abs(target - current), count - Math.abs(target - current));
    const target = [index, index + items.length].sort((a, b) => distance(a) - distance(b))[0];
    carousel.scrollTo(target, matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  return <div className="capability-carousel" role={mobile ? 'region' : undefined} aria-roledescription={mobile ? 'carousel' : undefined} aria-label={mobile ? label : undefined}
    onKeyDown={event => {
      if (!mobile || !carousel || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'ArrowRight';
      const jump = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (next) carousel.scrollNext(jump);
      else carousel.scrollPrev(jump);
      if (event.target.closest('.capability-carousel__pagination')) {
        event.currentTarget.querySelectorAll('.capability-carousel__pagination button')[carousel.selectedScrollSnap() % items.length]?.focus();
      }
    }}>
    <div className="capability-carousel__viewport" ref={viewportRef} tabIndex={mobile ? 0 : undefined} aria-label={mobile ? label : undefined}>
      <div className="capability-carousel__track">
        {/* A second sequence keeps the loop filled even with the narrower tablet cards. */}
        {[...items, ...items].map((item, index) => <div key={`${item.id}-${index}`} className={`capability-carousel__slide${index >= items.length ? ' capability-carousel__slide--copy' : ''}`} role={mobile ? 'group' : undefined}
          aria-hidden={mobile && index !== active ? true : undefined}
          aria-roledescription={mobile ? 'slide' : undefined} aria-label={mobile ? `${index % items.length + 1} / ${items.length}` : undefined}>
          <CapabilityWindow item={item} />
        </div>)}
      </div>
    </div>
    <div className="capability-carousel__pagination" aria-label={label}>
      {items.map((item, index) => <button key={item.id} type="button" aria-label={item.title.replace('\n', ' ')} aria-current={index === selectedItem ? 'true' : undefined}
        onClick={() => selectItem(index)}><span /></button>)}
    </div>
    <span className="sr-only" aria-live="polite" aria-atomic="true">{mobile ? items[selectedItem]?.title.replace('\n', ' ') : ''}</span>
  </div>;
}
