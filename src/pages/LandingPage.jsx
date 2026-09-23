import { useTranslation } from 'react-i18next';
import { setDocumentLanguage } from '../i18n/config';
import { placeholderAssets } from '../assets/pencil-placeholders';
import PageMeta from '../components/atoms/PageMeta';
import YakumaContact from '../components/organisms/YakumaContact';
import YakumaFaq from '../components/organisms/YakumaFaq';
import YakumaHero from '../components/organisms/YakumaHero';
import YakumaAbout from '../components/organisms/YakumaAbout';
import YakumaProjects from '../components/organisms/YakumaProjects';
import PageShell from '../layouts/PageShell';
import { buildFaqPageSchema } from '../seo/schema';

export default function LandingPage({ language }) {
  const normalizedLanguage = setDocumentLanguage(language);
  const { t } = useTranslation(['landing', 'common']);
  const faqItems = t('landing:faq.items', { returnObjects: true });
  const metaTitle = t('landing:meta.title');
  const metaDescription = t('landing:meta.description');
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@id': `/${normalizedLanguage}#organization`,
        '@type': 'Organization',
        email: `mailto:${t('common:contact.email')}`,
        founder: {
          '@type': 'Person',
          name: 'Yassin Kuczma',
        },
        logo: '/favicon.svg',
        name: 'Yakuma',
        url: `/${normalizedLanguage}`,
      },
      {
        '@id': `/${normalizedLanguage}#website`,
        '@type': 'WebSite',
        description: metaDescription,
        inLanguage: normalizedLanguage,
        name: 'Yakuma',
        publisher: {
          '@id': `/${normalizedLanguage}#organization`,
        },
        url: `/${normalizedLanguage}`,
      },
      buildFaqPageSchema({
        items: faqItems,
        language: normalizedLanguage,
        routePath: `/${normalizedLanguage}`,
      }),
    ],
  };

  return (
    <>
      <PageMeta
        description={metaDescription}
        image={placeholderAssets.yakumaHero}
        language={normalizedLanguage}
        path={`/${normalizedLanguage}`}
        structuredData={structuredData}
        title={metaTitle}
      />
      <PageShell
        headerBehavior="hero-reveal"
        headerVariant="yakuma"
        language={normalizedLanguage}
        mainClassName="page page--yakuma"
      >
        <YakumaHero language={normalizedLanguage} />

        <YakumaAbout language={normalizedLanguage} />

        <YakumaProjects language={normalizedLanguage} />

        <YakumaFaq
          language={normalizedLanguage}
          description={t('landing:faq.intro')}
          items={faqItems}
        />
        <YakumaContact />
      </PageShell>
    </>
  );
}
