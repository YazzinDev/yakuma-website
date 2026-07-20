import { useTranslation } from 'react-i18next';
import SectionKicker from '../atoms/SectionKicker';
import FooterLinks from './FooterLinks';

export default function LegalLinkGroup({ language, scope }) {
  const { t } = useTranslation('common');

  return (
    <aside aria-labelledby="legal-link-group-title" className="legal-link-group">
      <SectionKicker>{t('legal.linkGroupEyebrow')}</SectionKicker>
      <h2 id="legal-link-group-title">{t('legal.linkGroupTitle')}</h2>
      <FooterLinks
        ariaLabel={t('legal.linkGroupAriaLabel')}
        className="legal-link-group__links"
        language={language}
        scope={scope}
      />
    </aside>
  );
}
