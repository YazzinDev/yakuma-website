import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getAlternateLanguageHref, supportedLanguages } from '../../routes/localizedPaths';

export default function LanguageSwitcher({ language }) {
  const { t } = useTranslation('common');
  const location = useLocation();
  const navigate = useNavigate();
  const [currentHash, setCurrentHash] = useState('');

  useEffect(() => {
    const syncHash = () => setCurrentHash(window.location.hash || '');
    let syncTimer;
    const scheduleSyncHash = () => {
      window.clearTimeout(syncTimer);
      syncTimer = window.setTimeout(syncHash, 0);
    };
    const handleDocumentClick = (event) => {
      const anchor = event.target.closest?.('a[href*="#"]');
      if (anchor?.origin === window.location.origin) scheduleSyncHash();
    };

    syncHash();
    scheduleSyncHash();
    window.addEventListener('hashchange', syncHash);
    window.addEventListener('popstate', syncHash);
    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      window.removeEventListener('hashchange', syncHash);
      window.removeEventListener('popstate', syncHash);
      document.removeEventListener('click', handleDocumentClick, true);
      window.clearTimeout(syncTimer);
    };
  }, [location.pathname, location.search]);
  const switchLocation = { ...location, hash: location.hash || currentHash };

  function handleLanguageClick(event, targetLanguage, targetHref) {
    if (typeof window === 'undefined' || targetLanguage === language) return;

    const liveTargetHref = getAlternateLanguageHref(
      {
        hash: window.location.hash || currentHash || location.hash,
        pathname: window.location.pathname,
        search: window.location.search,
      },
      targetLanguage,
    );

    if (liveTargetHref !== targetHref) {
      event.preventDefault();
      navigate(liveTargetHref);
    }
  }

  return (
    <nav className="language-switcher" aria-label={t('language.label')}>
      {supportedLanguages.map((targetLanguage) => {
        const targetHref = getAlternateLanguageHref(switchLocation, targetLanguage);

        return (
          <Link
            aria-current={targetLanguage === language ? 'page' : undefined}
            className="language-switcher__item link-underline-target"
            key={targetLanguage}
            onClick={(event) => handleLanguageClick(event, targetLanguage, targetHref)}
            to={targetHref}
          >
            <span className="link-underline-target__text">{t(`language.${targetLanguage}`)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
