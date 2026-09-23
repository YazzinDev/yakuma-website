import { useTranslation } from 'react-i18next';
import ContactForm from '../molecules/ContactForm';
import ContactRoutingLabel from '../molecules/ContactRoutingLabel';
import HumanExchange from '../molecules/HumanExchange';
import SectionClosing from '../molecules/SectionClosing';
import arrows from '../../assets/design/frequency-arrows.svg';
import '../../styles/yakuma-contact.css';

export default function YakumaContact() {
  const { t } = useTranslation('common');
  const email = t('contact.email');
  return <section className="yakuma-contact" id="contact" aria-labelledby="contact-title">
    <h2 id="contact-title">LET’S TALK.</h2>
    <ContactRoutingLabel />
    <div className="yakuma-contact__body">
      <div className="yakuma-contact__copy">
        <p className="yakuma-contact__intro">{t('contact.pencilBody')}</p>
        <div className="yakuma-contact__direct">
          <HumanExchange />
          <p>{t('contact.orEmail')}</p>
          <a href={`mailto:${email}`}>{email}</a>
          <img className="yakuma-contact__arrows" src={arrows} alt="" />
          <span>IDEA IN / NEXT STEP OUT</span>
        </div>
      </div>
      <ContactForm variant="pencil" />
    </div>
    <SectionClosing symbol={null}>
      <span className="yakuma-contact__desktop-closing">YAKUMA / GET IN TOUCH</span>
      <a href={`mailto:${email}`}><span className="yakuma-contact__mobile-alternative">{t('contact.orEmail')} </span>{email}</a>
    </SectionClosing>
  </section>;
}
