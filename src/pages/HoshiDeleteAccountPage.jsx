import { useTranslation } from 'react-i18next';
import { setDocumentLanguage } from '../i18n/config';
import PageMeta from '../components/atoms/PageMeta';
import SectionKicker from '../components/atoms/SectionKicker';
import PageShell from '../layouts/PageShell';

export default function HoshiDeleteAccountPage({ language }) {
  const normalizedLanguage = setDocumentLanguage(language);
  const { t } = useTranslation(['hoshi', 'common']);
  const routePath = `/${normalizedLanguage}/games/hoshi/delete-account`;
  const deletion = t('hoshi:deleteAccount', { returnObjects: true });
  const supportHref = `mailto:${deletion.support.email}?subject=${encodeURIComponent(deletion.support.subject)}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    description: deletion.meta.description,
    inLanguage: normalizedLanguage,
    name: deletion.meta.title,
    url: routePath,
  };

  return (
    <>
      <PageMeta
        description={deletion.meta.description}
        language={normalizedLanguage}
        path={routePath}
        structuredData={structuredData}
        title={deletion.meta.title}
      />
      <PageShell
        footerScope="hoshi"
        headerBehavior="solid"
        headerVariant="hoshi"
        language={normalizedLanguage}
        mainClassName="page page--hoshi account-deletion-page"
      >
        <section className="account-deletion-hero hoshi-hero">
          <div className="hoshi-hero__content">
            <SectionKicker>{deletion.eyebrow}</SectionKicker>
            <h1>{deletion.title}</h1>
            <p>{deletion.introduction}</p>
          </div>
        </section>

        <section aria-labelledby="account-deletion-steps-title" className="account-deletion-instructions gameplay-section">
          <div className="account-deletion-instructions__content gameplay-section__copy">
            <SectionKicker>{deletion.steps.eyebrow}</SectionKicker>
            <h2 id="account-deletion-steps-title">{deletion.steps.title}</h2>
            <p className="account-deletion-instructions__introduction">{deletion.steps.introduction}</p>
            <ol className="account-deletion-steps">
              {deletion.steps.items.map((step, index) => (
                <li key={step}>
                  <span aria-hidden="true" className="account-deletion-steps__number">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span aria-hidden="true" className="account-deletion-steps__separator">
                    −
                  </span>
                  <p className="account-deletion-steps__text">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="account-deletion-support-title" className="account-deletion-support news-section">
          <div className="account-deletion-support__content">
            <SectionKicker>{deletion.support.eyebrow}</SectionKicker>
            <h2 id="account-deletion-support-title">{deletion.support.title}</h2>
            <p>{deletion.support.introduction}</p>
            <a className="account-deletion-support__link" href={supportHref}>
              <span>{deletion.support.email}</span>
              <span className="account-deletion-support__subject">{deletion.support.subjectLabel}</span>
            </a>
            <aside className="account-deletion-notice" role="note">
              <h3>{deletion.notice.title}</h3>
              <p>{deletion.notice.body}</p>
            </aside>
          </div>
        </section>
      </PageShell>
    </>
  );
}
