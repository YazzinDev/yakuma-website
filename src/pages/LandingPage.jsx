import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { localizedHref } from '../routes/localizedPaths';
import { setDocumentLanguage } from '../i18n/config';
import { placeholderAssets } from '../assets/pencil-placeholders';
import PageMeta from '../components/atoms/PageMeta';
import PlaceholderImage from '../components/atoms/PlaceholderImage';
import SectionKicker from '../components/atoms/SectionKicker';
import ContactSection from '../components/organisms/ContactSection';
import FaqSection from '../components/organisms/FaqSection';
import ProjectCarousel from '../components/molecules/ProjectCarousel';
import SocialProfileLink from '../components/molecules/SocialProfileLink';
import { yakumaSocialLinks } from '../config/socialLinks';
import PageShell from '../layouts/PageShell';
import { buildFaqPageSchema } from '../seo/schema';

export default function LandingPage({ language }) {
  const normalizedLanguage = setDocumentLanguage(language);
  const { t } = useTranslation(['landing', 'common']);
  const serviceItems = t('landing:services.items', { returnObjects: true });
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
  const projectItems = [
    {
      id: 'future-left',
      kind: 'placeholder',
      label: t('landing:projects.comingSoon'),
    },
    {
      id: 'hoshi-star-sudoku',
      kind: 'project',
      description: t('landing:projects.featured.description'),
      href: `/${normalizedLanguage}/games/hoshi`,
      image: placeholderAssets.hoshiStar,
      imageAlt: t('landing:images.hoshiProject'),
      linkLabel: t('landing:projects.featured.link'),
      title: t('landing:projects.featured.title'),
    },
    {
      id: 'future-right',
      kind: 'placeholder',
      label: t('landing:projects.comingSoon'),
    },
  ];

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
        <section className="landing-hero" id="hero">
          <img alt="" className="landing-hero__image" src={placeholderAssets.yakumaHero} />
          <div className="landing-hero__overlay" />
          <div className="landing-hero__content">
            <span aria-hidden="true" className="landing-hero__japanese">
              ヤクマ
            </span>
            <h1>{t('landing:hero.title')}</h1>
            <p>{t('landing:hero.subtitle')}</p>
          </div>
          <p className="landing-hero__copyright">{t('landing:hero.copyright')}</p>
          <SocialProfileLink
            className="landing-hero__social"
            href={yakumaSocialLinks.linkedin}
            label={t('landing:hero.social')}
            pendingLabel={t('landing:hero.socialPending')}
            profile="linkedin"
          />
        </section>

        <section className="about-section" id="about">
          <div className="about-section__copy">
            <SectionKicker>{t('landing:about.kicker')}</SectionKicker>
            <h2>{t('landing:about.title')}</h2>
            <p>{t('landing:about.body')}</p>
            <span aria-hidden="true">{t('landing:about.mark')}</span>
          </div>
          <PlaceholderImage
            alt={t('landing:images.about')}
            className="about-section__image"
            src={placeholderAssets.yakumaAbout}
          />
        </section>

        <section className="work-section" id="work">
          <PlaceholderImage
            alt={t('landing:images.services')}
            className="work-section__image"
            src={placeholderAssets.yakumaServices}
          />
          <div className="work-section__copy">
            <SectionKicker>{t('landing:services.kicker')}</SectionKicker>
            <h2>{t('landing:services.title')}</h2>
            <p>{t('landing:services.body')}</p>
            <div className="service-list">
              {serviceItems.map((item) => (
                <Link className="link-underline-target" key={item.href} to={localizedHref(normalizedLanguage, item.href)}>
                  <span className="link-underline-target__text">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="projects-section section-frame section-frame--showcase" id="projects">
          <div className="projects-section__header">
            <SectionKicker>{t('landing:projects.kicker')}</SectionKicker>
            <h2>{t('landing:projects.title')}</h2>
          </div>
          <ProjectCarousel
            items={projectItems}
            labels={{
              next: t('landing:projects.next'),
              previous: t('landing:projects.previous'),
            }}
          />
        </section>

        <FaqSection
          description={t('landing:faq.intro')}
          eyebrow={t('landing:faq.kicker')}
          items={faqItems}
          title={t('landing:faq.title')}
        />
        <ContactSection />
      </PageShell>
    </>
  );
}
