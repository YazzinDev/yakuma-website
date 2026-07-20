import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { setDocumentLanguage } from '../i18n/config';
import { hoshiDownloadConfig } from '../config/hoshiDownload';
import Button from '../components/atoms/Button';
import PageMeta from '../components/atoms/PageMeta';
import SectionKicker from '../components/atoms/SectionKicker';
import StoreBadge from '../components/molecules/StoreBadge';
import PageShell from '../layouts/PageShell';
import { buildHoshiDownloadSchema } from '../seo/schema';
import { resolveHoshiDownloadTarget } from '../utils/hoshiDownloadRedirect';

export default function HoshiDownloadPage({ language }) {
  const normalizedLanguage = setDocumentLanguage(language);
  const { t } = useTranslation(['hoshi', 'common']);
  const routePath = `/${normalizedLanguage}/games/hoshi/download`;
  const badges = t('hoshi:hero.badges', { returnObjects: true });
  const finalCta = t('hoshi:finalCta', { returnObjects: true });
  const metaTitle = t('hoshi:download.meta.title');
  const metaDescription = t('hoshi:download.meta.description');

  useEffect(() => {
    const target = resolveHoshiDownloadTarget(undefined, hoshiDownloadConfig.storeLinks);
    if (!target) return;

    window.location.replace(target.url);
  }, []);

  const structuredData = buildHoshiDownloadSchema({
    description: metaDescription,
    image: hoshiDownloadConfig.previewImage,
    language: normalizedLanguage,
    routePath,
    storeLinks: hoshiDownloadConfig.storeLinks,
  });

  return (
    <>
      <PageMeta
        description={metaDescription}
        image={hoshiDownloadConfig.previewImage}
        imageAlt={t('hoshi:download.imageAlt')}
        language={normalizedLanguage}
        path={routePath}
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
        <section className="download-section download-page__section">
          <div>
            <SectionKicker>{finalCta.eyebrow}</SectionKicker>
            <h1>{t('hoshi:download.title')}</h1>
            <p>{t('hoshi:download.body')}</p>
            <p aria-live="polite" className="download-page__status">
              {t('hoshi:download.fallback')}
            </p>
            <div className="store-badge-row">
              <StoreBadge
                href={hoshiDownloadConfig.storeLinks.appStore}
                label={badges.appStore}
                pendingLabel={badges.pending}
                small={badges.appStoreSmall}
                store="app-store"
              />
              <StoreBadge
                href={hoshiDownloadConfig.storeLinks.googlePlay}
                label={badges.googlePlay}
                pendingLabel={badges.pending}
                small={badges.googlePlaySmall}
                store="google-play"
              />
            </div>
            <Button href={`/${normalizedLanguage}${hoshiDownloadConfig.fallbackPath}`} variant="hoshi">
              {t('hoshi:download.backToHoshi')}
            </Button>
          </div>
          <div className="tablet-stage">
            <img alt={t('hoshi:download.imageAlt')} src={hoshiDownloadConfig.previewImage} />
          </div>
        </section>
      </PageShell>
    </>
  );
}
