import { useTranslation } from 'react-i18next';
import { setDocumentLanguage } from '../i18n/config';
import PageMeta from '../components/atoms/PageMeta';
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
        <section className="hoshi-delete">
          <h1>{deletion.title.split(' ').map((word, index) => <span key={`${word}-${index}`}>{index ? ` ${word}` : word}</span>)}</h1>
          <p className="hoshi-delete__intro">{deletion.introduction}</p>
          <div className="hoshi-delete__grid">
            <ol aria-label={deletion.steps.title} className="hoshi-delete__steps">
              {deletion.steps.items.map((step, index) => (
                <li key={step}>
                  <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
            <aside className="hoshi-delete__support">
              <h2>{deletion.support.title}</h2>
              <p>{deletion.support.introduction}</p>
              <a href={supportHref}>{deletion.support.email}</a>
              <p className="hoshi-delete__subject">{deletion.support.subjectLabel}</p>
            </aside>
          </div>
          <aside className="hoshi-delete__notice" role="note">
            <h2>{deletion.notice.title}</h2>
            <p>{deletion.notice.body}</p>
          </aside>
          <div className="hoshi-delete__closing"><span>HOSHI / ACCOUNT SUPPORT</span></div>
        </section>
      </PageShell>
    </>
  );
}
