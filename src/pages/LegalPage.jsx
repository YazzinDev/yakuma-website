import { useTranslation } from 'react-i18next';
import { setDocumentLanguage } from '../i18n/config';
import { supportedLanguages } from '../i18n/languages';
import { formatLegalDocumentDate, getLegalDocumentDate } from '../legal/documentDates';
import { getLegalDocument, isPendingLegalDocument, legalTitles } from '../legal/registry';
import { omitLegalRevision, readLegalRevision } from '../legal/revision';
import LegalDocument from '../components/organisms/LegalDocument';
import DocumentContents from '../components/molecules/DocumentContents';
import PrivacyIdentity from '../components/molecules/PrivacyIdentity';
import DisclosureRegister from '../components/organisms/DisclosureRegister';
import DisclosureIdentity from '../components/molecules/DisclosureIdentity';
import { buildLegalDocumentModel } from '../legal/documentModel';
import { parseLegalMarkdown } from '../legal/markdown';
import '../styles/legal-layout.css';
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
  const authoredRevision = readLegalRevision(markdown);
  const documentModel = buildLegalDocumentModel(omitLegalRevision(markdown));
  const isYakumaPrivacy = scope === 'yakuma' && docType === 'privacy-policy';
  const isYakumaDisclosure = scope === 'yakuma' && docType === 'legal-disclosure';
  const isYakumaDocument = isYakumaPrivacy || isYakumaDisclosure;
  const isHoshi = scope === 'hoshi';
  const isDisclosure = docType === 'legal-disclosure';
  const sourceHeading = isHoshi ? parseLegalMarkdown(markdown).find(block => block.type === 'h1')?.text : null;
  const hoshiIntro = isHoshi && !isDisclosure && documentModel.blocks[0]?.type === 'paragraph'
    ? documentModel.blocks.shift() : null;
  const title = legalTitles[docType]?.[normalizedLanguage] ?? docType;
  const updatedAt = getLegalDocumentDate(scope, normalizedLanguage, docType);
  const updatedDate = formatLegalDocumentDate(updatedAt, normalizedLanguage);
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
        headerVariant={scope === 'hoshi' ? 'hoshi' : 'yakuma'}
        language={normalizedLanguage}
        mainClassName={`page page--legal${isYakumaDocument ? ' legal-pencil legal-pencil--yakuma' : ''}${isYakumaDisclosure ? ' legal-pencil--disclosure' : ''}${isHoshi ? ' legal-pencil legal-pencil--hoshi' : ''}${isHoshi && isDisclosure ? ' legal-pencil--hoshi-disclosure' : ''}`}
      >
        <section className="legal-hero">
          <h1>{isHoshi && normalizedLanguage === 'de' && docType === 'privacy-policy'
            ? <>DATENSCHUTZ<span className="legal-title-break legal-title-break--compound" />ERKLÄRUNG</>
            : isHoshi && normalizedLanguage === 'de' && docType === 'terms-of-service'
              ? <>NUTZUNGS<span className="legal-title-break legal-title-break--compound" />BEDINGUNGEN</>
              : isHoshi && normalizedLanguage === 'en' ? docType === 'privacy-policy'
            ? <>PRIVACY<span className="legal-title-break"> </span>POLICY</>
            : docType === 'terms-of-service' ? <>TERMS OF<span className="legal-title-break"> </span>SERVICE</>
              : <>LEGAL<span className="legal-title-break"> </span>DISCLOSURE</>
            : isYakumaPrivacy ? normalizedLanguage === 'en'
            ? <>PRIVACY<span className="legal-title-break"> </span>POLICY.</>
            : <>DATENSCHUTZ<span className="legal-title-break" />ERKLÄRUNG</>
            : isYakumaDisclosure && normalizedLanguage === 'en' ? <>LEGAL<span className="legal-title-break"> </span>DISCLOSURE.</> : title}</h1>
          {isYakumaPrivacy && <PrivacyIdentity language={normalizedLanguage} />}
          {isYakumaDisclosure && <DisclosureIdentity language={normalizedLanguage} />}
          {isHoshi && docType === 'privacy-policy' && <span className="legal-hero__hoshi-triangle" aria-hidden="true" />}
          {isHoshi && isDisclosure && <p className="legal-hero__description">{documentModel.contents[0]?.text}</p>}
          {updatedDate ? (
            <p className="legal-hero__updated">
              <time dateTime={updatedAt}>{t(authoredRevision ? 'legal.revision' : 'legal.updated', { date: updatedDate })}</time>
            </p>
          ) : null}
          {!(isHoshi && isDisclosure) && <p className="legal-hero__description">{isYakumaDisclosure ? documentModel.contents[0]?.text : isHoshi && sourceHeading ? <>{sourceHeading}{hoshiIntro && <><br />{hoshiIntro.lines.map(line => line.text).join(' ')}</>}</> : heroDescription}</p>}
        </section>
        {isDisclosure ? <DisclosureRegister model={documentModel} language={normalizedLanguage} scope={scope} /> : <div className="legal-reading-layout">
          <DocumentContents items={documentModel.contents} language={normalizedLanguage} />
          <LegalDocument language={normalizedLanguage} model={documentModel} />
        </div>}
        {isYakumaDocument || isHoshi ? <div className="legal-closing"><span>{scope.toUpperCase()} / {title.toUpperCase()}</span><span>{isHoshi ? '' : 'DOCUMENT 01 / '}{normalizedLanguage.toUpperCase()}</span></div> : <LegalLinkGroup language={normalizedLanguage} scope={scope} />}
      </PageShell>
    </>
  );
}
