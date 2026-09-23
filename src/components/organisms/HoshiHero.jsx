import { useTranslation } from 'react-i18next';
import StoreBadge from '../molecules/StoreBadge';
import hoshiPhone from '../../assets/pencil-hoshi/EraVR.webp';

const triangles = [
  'left-high', 'left-low', 'center-top', 'center-low', 'right-high',
  'right-low', 'phone-back', 'phone-base', 'phone-small', 'bottom-pale', 'bottom-mint',
];

export default function HoshiHero({ storeLinks, variant = 'home' }) {
  const { t } = useTranslation('hoshi');
  const badges = t('hero.badges', { returnObjects: true });
  const isDownload = variant === 'download';

  return (
    <section className={`hoshi-hero hoshi-hero--${variant}`} id={isDownload ? undefined : 'hero'}>
      <div aria-hidden="true" className="hoshi-hero__art">
        {triangles.map(name => <span className={`hoshi-hero__triangle hoshi-hero__triangle--${name}`} key={name} />)}
      </div>
      <div className="hoshi-hero__inner">
        <div className="hoshi-hero__content">
          <h1>{isDownload ? t('download.title') : <>HOSHI:<br />STAR SUDOKU</>}</h1>
          <p>{isDownload ? t('download.body') : t('hero.subtitle')}</p>
          <div className="store-badge-row">
            <StoreBadge href={storeLinks.appStore} label={badges.appStore} pendingLabel={badges.pending} small={badges.appStoreSmall} store="app-store" />
            <StoreBadge href={storeLinks.googlePlay} label={badges.googlePlay} pendingLabel={badges.pending} small={badges.googlePlaySmall} store="google-play" />
          </div>
        </div>
        <img alt={t('images.hero')} className="hoshi-hero__phone" decoding="async" fetchpriority="high" height="781" src={hoshiPhone} width="481" />
      </div>
    </section>
  );
}
