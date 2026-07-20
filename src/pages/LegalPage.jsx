import { useTranslation } from 'react-i18next';
import { setDocumentLanguage } from '../i18n/config';
import { supportedLanguages } from '../i18n/languages';
import { formatLegalDocumentDate, getLegalDocumentDate } from '../legal/documentDates';
import { getLegalDocument, isPendingLegalDocument, legalTitles } from '../legal/registry';
import LegalDocument from '../components/organisms/LegalDocument';
import LegalLinkGroup from '../components/molecules/LegalLinkGroup';
import PageMeta from '../components/atoms/PageMeta';
import PageShell from '../layouts/PageShell';

function hasPublishedLegalDocument(scope, language, docType) {
  try {
    return !isPendingLegalDocument(getLegalDocument(scope, language, docType));
  } catch {
    return false;
  }
}

export default function LegalPage({ docType, language, scope }) {
  const normalizedLanguage = setDocumentLanguage(language);
  const { t } = useTranslation('common');
  const markdown = getLegalDocument(scope, normalizedLanguage, docType);
  const title = legalTitles[docType]?.[normalizedLanguage] ?? docType;
  const updatedDate = formatLegalDocumentDate(
    getLegalDocumentDate(scope, normalizedLanguage, docType),
    normalizedLanguage,
  );
  const pathPrefix = scope === 'hoshi' ? 'games/hoshi/legal' : 'legal';
  const isPendingDocument = isPendingLegalDocument(markdown);
  const description = t(
    scope === 'hoshi' ? 'legal.metaDescriptionHoshi' : 'legal.metaDescriptionYakuma',
    { title },
  );
  const heroDescription = t(`legal.heroDescription.${scope}.${docType}`);
  const alternateLanguages = supportedLanguages.filter((targetLanguage) =>
    hasPublishedLegalDocument(scope, targetLanguage, docType),
  );

  return (
    <>
      <PageMeta
        alternateLanguages={alternateLanguages}
        description={description}
        language={normalizedLanguage}
        noIndex={isPendingDocument}
        path={`/${normalizedLanguage}/${pathPrefix}/${docType}`}
        title={`${title} | Yakuma`}
      />
      <PageShell
        footerScope={scope}
        headerVariant={scope === 'hoshi' ? 'hoshi' : 'black'}
        language={normalizedLanguage}
        mainClassName="page page--legal"
      >
        <section className="legal-hero">
          <h1>{title}</h1>
          {updatedDate ? <p className="legal-hero__updated">{t('legal.updated', { date: updatedDate })}</p> : null}
          <p className="legal-hero__description">{heroDescription}</p>
        </section>
        <LegalDocument language={normalizedLanguage} markdown={markdown} />
        <LegalLinkGroup language={normalizedLanguage} scope={scope} />
      </PageShell>
    </>
  );
}
