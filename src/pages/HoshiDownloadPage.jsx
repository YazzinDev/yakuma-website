import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { setDocumentLanguage } from '../i18n/config';
import { hoshiDownloadConfig } from '../config/hoshiDownload';
import hoshiHeroImage from '../assets/pencil-hoshi/EraVR.webp';
import PageMeta from '../components/atoms/PageMeta';
import HoshiHero from '../components/organisms/HoshiHero';
import PageShell from '../layouts/PageShell';
import { buildHoshiDownloadSchema } from '../seo/schema';
import { resolveHoshiDownloadTarget } from '../utils/hoshiDownloadRedirect';

export default function HoshiDownloadPage({ language }) {
  const normalizedLanguage = setDocumentLanguage(language);
  const { t } = useTranslation(['hoshi', 'common']);
  const routePath = `/${normalizedLanguage}/games/hoshi/download`;
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
        <HoshiHero storeLinks={hoshiDownloadConfig.storeLinks} variant="download" />
      </PageShell>
    </>
  );
}
