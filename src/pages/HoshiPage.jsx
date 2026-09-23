import { useTranslation } from 'react-i18next';
import { setDocumentLanguage } from '../i18n/config';
import hoshiFeatureBanner from '../assets/pencil-hoshi/feature-banner.webp';
import hoshiHeroImage from '../assets/pencil-hoshi/EraVR.webp';
import PageMeta from '../components/atoms/PageMeta';
import FaqSection from '../components/organisms/FaqSection';
import HoshiHero from '../components/organisms/HoshiHero';
import HoshiAbout from '../components/organisms/HoshiAbout';
import HoshiHowToPlay from '../components/organisms/HoshiHowToPlay';
import { hoshiStoreLinks } from '../config/storeLinks';
import PageShell from '../layouts/PageShell';
import { buildFaqPageSchema } from '../seo/schema';

export default function HoshiPage({ language }) {
  const normalizedLanguage = setDocumentLanguage(language);
  const { t } = useTranslation(['hoshi', 'common']);
  const faqItems = t('hoshi:faq.items', { returnObjects: true });
  const metaTitle = t('hoshi:meta.title');
  const metaDescription = t('hoshi:meta.description');
  const routePath = `/${normalizedLanguage}/games/hoshi`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@id': `${routePath}#game`,
        '@type': 'VideoGame',
        applicationCategory: 'GameApplication',
        description: metaDescription,
        gamePlatform: ['iOS', 'Android'],
        image: hoshiFeatureBanner,
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
        image={hoshiFeatureBanner}
        imageAlt={t('hoshi:images.hero')}
        language={normalizedLanguage}
        path={routePath}
        preloadImage={hoshiHeroImage}
        structuredData={structuredData}
        title={metaTitle}
      />
      <PageShell
        footerScope="hoshi"
        headerBehavior="solid"
        headerVariant="hoshi"
        language={normalizedLanguage}
        mainClassName="page page--hoshi"
      >
        <HoshiHero storeLinks={hoshiStoreLinks} />

        <HoshiAbout />

        <HoshiHowToPlay />

        <FaqSection
          description={null}
          eyebrow={null}
          items={faqItems}
          title={t('hoshi:faq.title')}
          variant="hoshi"
        />

        <HoshiAbout variant="download" />
      </PageShell>
    </>
  );
}
