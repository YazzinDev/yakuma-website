import { useTranslation } from 'react-i18next';
import { setDocumentLanguage } from '../i18n/config';
import { placeholderAssets } from '../assets/pencil-placeholders';
import ContactSection from '../components/organisms/ContactSection';
import FaqSection from '../components/organisms/FaqSection';
import PageMeta from '../components/atoms/PageMeta';
import ServiceDetailSection from '../components/organisms/ServiceDetailSection';
import ServiceHero from '../components/organisms/ServiceHero';
import PageShell from '../layouts/PageShell';
import { buildFaqPageSchema } from '../seo/schema';

export default function ServicePage({ language, serviceId }) {
  const normalizedLanguage = setDocumentLanguage(language);
  const { t } = useTranslation(['services', 'common']);
  const capabilities = t(`services:${serviceId}.capabilities`, { returnObjects: true });
  const faqs = t(`services:${serviceId}.faqs`, { returnObjects: true });
  const title = t(`services:${serviceId}.title`);
  const intro = t(`services:${serviceId}.intro`);
  const heroKicker = t(`services:${serviceId}.heroKicker`);
  const detailHeading = t(`services:${serviceId}.detailHeading`);
  const backgroundWord = t(`services:${serviceId}.backgroundWord`);
  const heroImage = placeholderAssets.serviceHeroes[serviceId];
  const capabilityImages = placeholderAssets.services[serviceId];
  const cleanTitle = title.replace(/\n/g, ' ');
  const metaTitle = `${cleanTitle} | ${t('services:meta.titleSuffix')}`;
  const heroImageAlt = t('services:meta.heroImageAlt', { title: cleanTitle });
  const routePath = `/${normalizedLanguage}/services/${serviceId}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@id': `${routePath}#service`,
        '@type': 'Service',
        description: intro,
        image: heroImage,
        inLanguage: normalizedLanguage,
        name: cleanTitle,
        provider: {
          '@id': `/${normalizedLanguage}#organization`,
          '@type': 'Organization',
          name: 'Yakuma',
          url: `/${normalizedLanguage}`,
        },
        serviceType: cleanTitle,
        url: routePath,
      },
      buildFaqPageSchema({
        items: faqs,
        language: normalizedLanguage,
        routePath,
      }),
    ],
  };

  return (
    <>
      <PageMeta
        description={intro}
        image={heroImage}
        imageAlt={heroImageAlt}
        language={normalizedLanguage}
        path={routePath}
        structuredData={structuredData}
        title={metaTitle}
      />
      <PageShell headerElevated headerVariant="black" language={normalizedLanguage} mainClassName="page page--service">
        <ServiceHero
          backgroundWord={backgroundWord}
          image={heroImage}
          imageAlt={heroImageAlt}
          intro={intro}
          kicker={heroKicker}
          title={title}
        />
        <ServiceDetailSection
          capabilities={capabilities}
          heading={detailHeading}
          images={capabilityImages}
          kicker={t('services:meta.detailKicker')}
        />
        <FaqSection
          description={t(`services:${serviceId}.faqIntro`)}
          eyebrow={t('services:meta.faqKicker')}
          items={faqs}
          title={t('services:meta.faqTitle')}
        />
        <ContactSection />
      </PageShell>
    </>
  );
}
