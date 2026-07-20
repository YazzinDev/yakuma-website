import { useTranslation } from 'react-i18next';
import SectionKicker from '../atoms/SectionKicker';
import ContactForm from '../molecules/ContactForm';

export default function ContactSection({ id = 'contact' }) {
  const { t } = useTranslation('common');

  return (
    <section className="contact-section" id={id}>
      <div className="contact-section__copy">
        <SectionKicker>{t('contact.kicker')}</SectionKicker>
        <h2>{t('contact.title')}</h2>
        <p>{t('contact.body')}</p>
        <a className="link-underline-target" href={`mailto:${t('contact.email')}`}>
          <span className="link-underline-target__text">{t('contact.email')}</span>
        </a>
      </div>
      <ContactForm />
    </section>
  );
}
