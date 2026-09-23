import { useTranslation } from 'react-i18next';
import StoreBadge from '../molecules/StoreBadge';
import featureBanner from '../../assets/pencil-hoshi/feature-banner.webp';
import { hoshiStoreLinks } from '../../config/storeLinks';

export default function HoshiAbout({ variant = 'about' }) {
  const { t } = useTranslation('hoshi');
  const badges = t('hero.badges', { returnObjects: true });
  const isDownload = variant === 'download';

  return (
    <section className={`hoshi-about hoshi-about--${variant}`} id={isDownload ? 'download' : 'about'}>
      <div className="hoshi-about__inner">
        <div className="hoshi-about__copy">
          <h2>{t(isDownload ? 'finalCta.title' : 'twist.title')}</h2>
          <p>{t(isDownload ? 'finalCta.body' : 'twist.description')}</p>
          <div className="store-badge-row">
            <StoreBadge href={hoshiStoreLinks.appStore} label={badges.appStore} pendingLabel={badges.pending} small={badges.appStoreSmall} store="app-store" />
            <StoreBadge href={hoshiStoreLinks.googlePlay} label={badges.googlePlay} pendingLabel={badges.pending} small={badges.googlePlaySmall} store="google-play" />
          </div>
        </div>
        <img alt={t('images.featureBanner')} className="hoshi-about__banner" loading="lazy" src={featureBanner} />
      </div>
      <span aria-hidden="true" className="hoshi-about__triangle" />
    </section>
  );
}
