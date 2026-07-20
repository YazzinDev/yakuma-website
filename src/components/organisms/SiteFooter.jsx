import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import FooterLinks from '../molecules/FooterLinks';

export default function SiteFooter({ language, scope = 'yakuma' }) {
  const { t } = useTranslation('common');

  return (
    <footer className="site-footer">
      <div>
        <h2>
          <Link className="link-underline-target" to={`/${language}`}>
            <span className="link-underline-target__text">{t('brand')}</span>
          </Link>
        </h2>
        <p>{t('footer.copyright')}</p>
        <p>{t('footer.madeInGermany')}</p>
      </div>
      <p className="site-footer__line">{t('footer.studioLine')}</p>
      <FooterLinks language={language} scope={scope} />
    </footer>
  );
}
