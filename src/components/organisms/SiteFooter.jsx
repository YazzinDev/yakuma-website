import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import FooterLinks from '../molecules/FooterLinks';
import Wordmark from '../atoms/Wordmark';
import Micrographic from '../atoms/Micrographic';
import '../../styles/site-footer.css';

export default function SiteFooter({ language, scope = 'yakuma' }) {
  const { t } = useTranslation('common');

  return (
    <footer className={`site-footer site-footer--${scope}`}>
        <h2 className="site-footer__brand">
          <Link className="link-underline-target" to={`/${language}`}>
            <Wordmark placement="footer" className="link-underline-target__text" />
          </Link>
        </h2>
      {scope === 'yakuma' && <Micrographic className="site-footer__marker" />}
      <p className="site-footer__line">{t('brand.slogan')}</p>
      <p className="site-footer__copyright">COPYRIGHT 2026 YAKUMA /<span> YASSIN KUCZMA</span></p>
      <p className="site-footer__origin">{t('footer.madeInGermany')}</p>
      <FooterLinks language={language} scope={scope} />
    </footer>
  );
}
