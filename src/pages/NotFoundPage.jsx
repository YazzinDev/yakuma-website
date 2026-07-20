import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setDocumentLanguage } from '../i18n/config';
import PageMeta from '../components/atoms/PageMeta';
import PageShell from '../layouts/PageShell';

export default function NotFoundPage({ language = 'de' }) {
  const normalizedLanguage = setDocumentLanguage(language);
  const { t } = useTranslation('common');
  const location = useLocation();

  return (
    <>
      <PageMeta
        description={t('notFound.body')}
        language={normalizedLanguage}
        noIndex
        path={location.pathname}
        title={`${t('notFound.title')} | Yakuma`}
      />
      <PageShell language={normalizedLanguage} mainClassName="not-found">
        <h1>{t('notFound.title')}</h1>
        <p>{t('notFound.body')}</p>
        <Link to={`/${normalizedLanguage}`}>{t('notFound.home')}</Link>
      </PageShell>
    </>
  );
}
