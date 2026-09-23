import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import slideOne from '../../assets/pencil-hoshi/slide-1.webp';
import slideTwo from '../../assets/pencil-hoshi/slide-2.webp';
import slideThree from '../../assets/pencil-hoshi/slide-3.webp';
import slideFour from '../../assets/pencil-hoshi/slide-4.webp';
import slideFive from '../../assets/pencil-hoshi/slide-5.webp';

const slides = [slideOne, slideTwo, slideThree, slideFour, slideFive];

export default function HoshiHowToPlay() {
  const { t } = useTranslation('hoshi');
  const galleryRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);

  function updateActiveSlide() {
    const gallery = galleryRef.current;
    if (!gallery) return;
    const cards = [...gallery.children];
    const left = gallery.scrollLeft + gallery.clientWidth * 0.06;
    const nearest = cards.reduce((best, card, index) =>
      Math.abs(card.offsetLeft - left) < Math.abs(cards[best].offsetLeft - left) ? index : best, 0);
    setActiveSlide(nearest);
  }

  function showSlide(index) {
    galleryRef.current?.children[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    setActiveSlide(index);
  }

  return (
    <section className="hoshi-how-to" id="gameplay">
      <div className="hoshi-how-to__intro">
        <h2>{t('howToPlay.title')}</h2>
        <p>{t('howToPlay.description')}</p>
      </div>
      <div aria-label={t('howToPlay.galleryLabel')} className="hoshi-how-to__gallery" onScroll={updateActiveSlide} ref={galleryRef}>
        {slides.map((src, index) => <img alt={t('howToPlay.slideAlt', { number: index + 1 })} key={src} loading="lazy" src={src} />)}
      </div>
      <div aria-label={t('howToPlay.paginationLabel')} className="hoshi-how-to__pagination">
        {slides.map((src, index) => <button aria-label={t('howToPlay.showSlide', { number: index + 1 })} aria-current={index === activeSlide ? 'true' : undefined} key={src} onClick={() => showSlide(index)} type="button" />)}
      </div>
    </section>
  );
}
