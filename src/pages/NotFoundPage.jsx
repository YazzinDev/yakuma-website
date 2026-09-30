import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setDocumentLanguage } from '../i18n/config';
import PageMeta from '../components/atoms/PageMeta';
import PageShell from '../layouts/PageShell';
import ActionLink from '../components/atoms/ActionLink';
import Button from '../components/atoms/Button';
import HoshiText from '../components/atoms/HoshiText';
import ErrorSignal, { ErrorRegister } from '../components/molecules/ErrorSignal';
import PuzzleErrorMark from '../components/molecules/PuzzleErrorMark';
import '../styles/error-page.css';

export default function NotFoundPage({ language = 'de', scope = 'yakuma' }) {
  const normalizedLanguage = setDocumentLanguage(language);
  const { t } = useTranslation('common');
  const location = useLocation();
  const isHoshi = scope === 'hoshi';
  const copy = t(`notFound.${scope}`, { returnObjects: true });
  const home = `/${normalizedLanguage}${isHoshi ? '/games/hoshi' : ''}`;

  return (
    <>
      <PageMeta
        description={copy.body.replaceAll('\n', ' ')}
        language={normalizedLanguage}
        noIndex
        path={location.pathname}
        title={`404 – ${copy.title.replaceAll('\n', ' ')} | ${isHoshi ? 'Hoshi' : 'Yakuma'}`}
      />
      <PageShell language={normalizedLanguage} headerVariant={scope} showFooter={false} mainClassName={`error-page error-page--${scope}`}>
        {!isHoshi && <ErrorRegister />}
        <div className="error-page__content">
          {isHoshi ? <PuzzleErrorMark /> : <div className="error-page__number" aria-hidden="true">404</div>}
          {isHoshi
            ? <HoshiText as="h1" variant="display" align="center"><span className="sr-only">404: </span>{copy.title}</HoshiText>
            : <h1><span className="sr-only">404: </span>{copy.title}</h1>}
          {isHoshi ? <HoshiText variant="lead" align="center">{copy.body}</HoshiText> : <p className="error-page__description">{copy.body}</p>}
          {isHoshi
            ? <Button href={home} variant="hoshi" className="error-page__home"><span aria-hidden="true">← &nbsp;</span>{copy.home}</Button>
            : <ActionLink to={home} className="error-page__home">{copy.home}</ActionLink>}
        </div>
        {isHoshi ? <><span className="error-page__triangle error-page__triangle--pale" aria-hidden="true" /><span className="error-page__triangle error-page__triangle--mint" aria-hidden="true" /></> : <>
          <ErrorSignal />
          <div className="error-page__closing" aria-hidden="true"><span>404 // NO MATCH FOUND.</span><span>[ YK-SIGNAL / NULL ]<span className="error-page__closing-extra"> • LOC: [004.000] • SYS: DISCONNECTED</span></span></div>
        </>}
      </PageShell>
    </>
  );
}
