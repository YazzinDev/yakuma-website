import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function normalizePath(pathname) {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export default function FooterLinks({ ariaLabel, className = 'footer-links', language, scope }) {
  const { t } = useTranslation('common');
  const location = useLocation();
  const currentPath = normalizePath(location.pathname);
  const base = scope === 'hoshi' ? `/${language}/games/hoshi/legal` : `/${language}/legal`;
  const links = [
    { label: t('footer.privacyPolicy'), to: `${base}/privacy-policy` },
    { label: t('footer.legalDisclosure'), to: `${base}/legal-disclosure` },
  ];

  if (scope === 'hoshi') {
    links.push({ label: t('footer.termsOfService'), to: `${base}/terms-of-service` });
  }

  return (
    <nav className={className} aria-label={ariaLabel ?? t('footer.legalLinksAria')}>
      {links.map((link) => (
        <Link
          aria-current={currentPath === link.to ? 'page' : undefined}
          className="link-underline-target"
          key={link.to}
          to={link.to}
        >
          <span className="link-underline-target__text">{link.label}</span>
        </Link>
      ))}
    </nav>
  );
}
