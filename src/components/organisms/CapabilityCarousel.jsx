import { useEffect, useRef, useState } from 'react';
import CapabilityWindow from '../molecules/CapabilityWindow';

export default function CapabilityCarousel({ items, language }) {
  const [active, setActive] = useState(1);
  const [mobile, setMobile] = useState(false);
  const [direction, setDirection] = useState(0);
  const pointer = useRef(null);
  const moved = useRef(false);
  const timer = useRef(null);
  const count = items.length;
  useEffect(() => {
    const media = matchMedia('(max-width: 1100px)');
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => { media.removeEventListener('change', update); clearTimeout(timer.current); };
  }, []);
  function advance(step) {
    if (direction) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setActive(current => (current + step + count) % count);
      return;
    }
    setDirection(step);
    timer.current = setTimeout(() => {
      setActive(current => (current + step + count) % count);
      setDirection(0);
    }, 240);
  }
  function endSwipe(event) {
    if (!pointer.current || pointer.current.id !== event.pointerId) return;
    const dx = event.clientX - pointer.current.x;
    const dy = event.clientY - pointer.current.y;
    pointer.current = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      moved.current = true;
      advance(dx < 0 ? 1 : -1);
    }
  }
  const label = language === 'de' ? 'Unsere Disziplinen' : 'Our disciplines';
  return <div className="capability-carousel" role={mobile ? 'region' : undefined} aria-roledescription={mobile ? 'carousel' : undefined} aria-label={mobile ? label : undefined}
    onKeyDown={event => {
      if (!mobile || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const step = event.key === 'ArrowRight' ? 1 : -1;
      if (event.target.closest('.capability-carousel__slide')) {
        event.currentTarget.querySelectorAll('.capability-carousel__pagination button')[(active + step + count) % count]?.focus();
      }
      advance(step);
    }}>
    <div className={`capability-carousel__viewport${direction ? ' is-moving' : ''}`} style={{ '--direction': direction }}
      onPointerDown={event => {
        if (!mobile || !event.isPrimary || event.button !== 0) return;
        moved.current = false;
        pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
      }} onPointerUp={endSwipe} onPointerCancel={() => { pointer.current = null; }}
      onClickCapture={event => { if (moved.current) { event.preventDefault(); moved.current = false; } }}>
      {items.map((item, index) => {
        const offset = ((index - active + count + 1) % count) - 1;
        return <div key={item.id} className="capability-carousel__slide" style={{ '--offset': offset }} aria-hidden={mobile && index !== active ? true : undefined}>
          <CapabilityWindow item={item} />
        </div>;
      })}
    </div>
    <div className="capability-carousel__pagination" aria-label={label}>
      {items.map((item, index) => <button key={item.id} type="button" aria-label={item.title.replace('\n', ' ')} aria-current={index === active ? 'true' : undefined}
        onClick={() => { clearTimeout(timer.current); setDirection(0); setActive(index); }}><span /></button>)}
    </div>
    <span className="sr-only" aria-live="polite" aria-atomic="true">{mobile ? items[active].title.replace('\n', ' ') : ''}</span>
  </div>;
}
