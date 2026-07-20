import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import SkipLink from '../components/atoms/SkipLink';
import SiteFooter from '../components/organisms/SiteFooter';
import SiteHeader from '../components/organisms/SiteHeader';
import useScrollReveal from '../hooks/useScrollReveal';

export default function PageShell({
  children,
  footerScope = 'yakuma',
  headerBehavior,
  headerElevated = false,
  headerVariant = 'yakuma',
  language,
  mainClassName,
}) {
  const { t } = useTranslation('common');
  const mainRef = useRef(null);
  useScrollReveal(mainRef);

  return (
    <>
      <SkipLink>{t('accessibility.skipToContent')}</SkipLink>
      <SiteHeader behavior={headerBehavior} elevated={headerElevated} language={language} variant={headerVariant} />
      <main className={mainClassName} id="main-content" ref={mainRef}>
        {children}
      </main>
      <SiteFooter language={language} scope={footerScope} />
    </>
  );
}
