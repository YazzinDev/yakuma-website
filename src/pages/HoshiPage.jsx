import { useTranslation } from 'react-i18next';
import { setDocumentLanguage } from '../i18n/config';
import { placeholderAssets } from '../assets/pencil-placeholders';
import Button from '../components/atoms/Button';
import PageMeta from '../components/atoms/PageMeta';
import PlayPlaceholderButton from '../components/atoms/PlayPlaceholderButton';
import SectionKicker from '../components/atoms/SectionKicker';
import FaqSection from '../components/organisms/FaqSection';
import HoshiDownloadSection from '../components/organisms/HoshiDownloadSection';
import HoshiNewsSection from '../components/organisms/HoshiNewsSection';
import StoreBadge from '../components/molecules/StoreBadge';
import { hoshiMediaLinks } from '../config/mediaLinks';
import { hoshiStoreLinks } from '../config/storeLinks';
import PageShell from '../layouts/PageShell';
import { buildFaqPageSchema } from '../seo/schema';

export default function HoshiPage({ language }) {
  const normalizedLanguage = setDocumentLanguage(language);
  const { t } = useTranslation(['hoshi', 'common']);
  const badges = t('hoshi:hero.badges', { returnObjects: true });
  const finalCta = t('hoshi:finalCta', { returnObjects: true });
  const news = t('hoshi:news', { returnObjects: true });
  const gameplayCards = t('hoshi:loop.cards', { returnObjects: true });
  const faqItems = t('hoshi:faq.items', { returnObjects: true });
  const metaTitle = t('hoshi:meta.title');
  const metaDescription = t('hoshi:meta.description');
  const routePath = `/${normalizedLanguage}/games/hoshi`;
  const trailerHref = hoshiMediaLinks.trailer ?? '#trailer';
  const hoshiPlaceholderImage = placeholderAssets.hoshiBoard;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@id': `${routePath}#game`,
        '@type': 'VideoGame',
        applicationCategory: 'GameApplication',
        description: metaDescription,
        gamePlatform: ['iOS', 'Android'],
        image: hoshiPlaceholderImage,
        inLanguage: normalizedLanguage,
        name: 'Hoshi: Star Sudoku',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'EUR',
        },
        publisher: {
          '@id': `/${normalizedLanguage}#organization`,
          '@type': 'Organization',
          name: 'Yakuma',
          url: `/${normalizedLanguage}`,
        },
        url: routePath,
      },
      buildFaqPageSchema({
        items: faqItems,
        language: normalizedLanguage,
        routePath,
      }),
    ],
  };

  return (
    <>
      <PageMeta
        description={metaDescription}
        image={hoshiPlaceholderImage}
        imageAlt={t('hoshi:images.hero')}
        language={normalizedLanguage}
        path={routePath}
        structuredData={structuredData}
        title={metaTitle}
      />
      <PageShell
        footerScope="hoshi"
        headerBehavior="hero-reveal"
        headerVariant="hoshi"
        language={normalizedLanguage}
        mainClassName="page page--hoshi"
      >
        <section className="hoshi-hero" id="hero">
          <img alt="" className="hoshi-hero__background" src={hoshiPlaceholderImage} />
          <div className="hoshi-hero__overlay" />
          <div className="hoshi-hero__content">
            <SectionKicker>{t('hoshi:hero.eyebrow')}</SectionKicker>
            <h1>{t('hoshi:hero.title')}</h1>
            <p>{t('hoshi:hero.subtitle')}</p>
            <div className="store-badge-row">
              <StoreBadge
                href={hoshiStoreLinks.appStore}
                label={badges.appStore}
                pendingLabel={badges.pending}
                small={badges.appStoreSmall}
                store="app-store"
              />
              <StoreBadge
                href={hoshiStoreLinks.googlePlay}
                label={badges.googlePlay}
                pendingLabel={badges.pending}
                small={badges.googlePlaySmall}
                store="google-play"
              />
            </div>
          </div>
        </section>

        <section className="hoshi-split" id="about">
          <div>
            <SectionKicker>{t('hoshi:twist.eyebrow')}</SectionKicker>
            <h2>{t('hoshi:twist.title')}</h2>
            <p>{t('hoshi:twist.description')}</p>
            <Button href={trailerHref} variant="hoshi">
              {t('common:cta.watchTrailer')}
            </Button>
          </div>
          <div aria-label={t('hoshi:trailer.label')} className="video-placeholder" id="trailer">
            <img alt={t('hoshi:images.trailer')} src={hoshiPlaceholderImage} />
            <PlayPlaceholderButton
              href={hoshiMediaLinks.trailer}
              label={hoshiMediaLinks.trailer ? t('common:cta.watchTrailer') : t('hoshi:trailer.pending')}
            />
          </div>
        </section>

        <section className="gameplay-section" id="gameplay">
          <div className="gameplay-section__copy">
            <SectionKicker>{t('hoshi:loop.eyebrow')}</SectionKicker>
            <h2>{t('hoshi:loop.title')}</h2>
          </div>
          <div className="gameplay-card-row">
            {gameplayCards.map((card) => (
              <article className="gameplay-card" key={card.title}>
                <span className="gameplay-card__visual">
                  <img alt={card.imageAlt} src={hoshiPlaceholderImage} />
                </span>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <HoshiNewsSection image={hoshiPlaceholderImage} imageAlt={t('hoshi:images.board')} news={news} />

        <FaqSection
          description={t('hoshi:faq.description')}
          eyebrow={t('hoshi:faq.eyebrow')}
          items={faqItems}
          title={t('hoshi:faq.title')}
          variant="hoshi"
        />

        <HoshiDownloadSection
          badges={badges}
          cta={finalCta}
          image={hoshiPlaceholderImage}
          imageAlt={t('hoshi:images.finalDevice')}
          storeLinks={hoshiStoreLinks}
        />
      </PageShell>
    </>
  );
}
