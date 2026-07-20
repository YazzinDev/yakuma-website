import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HCAPTCHA_SITE_KEY, WEB3FORMS_ACCESS_KEY, WEB3FORMS_ENDPOINT } from '../../config/contactForm';
import Button from '../atoms/Button';
import TextInput from '../atoms/TextInput';

const initialFormState = {
  email: '',
  message: '',
  name: '',
  project: '',
};

function cleanValue(value) {
  return value.trim();
}

export default function ContactForm() {
  const { i18n, t } = useTranslation('common');
  const fields = t('contact.fields', { returnObjects: true });
  const subjectPrefix = t('contact.subjectPrefix');
  const captchaRef = useRef(null);
  const [formData, setFormData] = useState(initialFormState);
  const [captchaToken, setCaptchaToken] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ message: '', state: 'idle' });
  const isSubmitting = submitStatus.state === 'sending';

  async function requestCaptchaPrompt() {
    const captcha = captchaRef.current;

    document.querySelector('.contact-form__captcha')?.scrollIntoView({ block: 'center', behavior: 'smooth' });

    if (typeof captcha?.execute !== 'function') {
      return;
    }

    try {
      await captcha.execute({ async: true });
    } catch {
      // The visible checkbox widget may require manual interaction when no challenge can be opened programmatically.
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setIsClient(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (submitStatus.message) {
      setSubmitStatus({ message: '', state: 'idle' });
    }
  }

  function resetCaptcha() {
    captchaRef.current?.resetCaptcha();
    setCaptchaToken('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!captchaToken) {
      setSubmitStatus({ message: t('contact.statusCaptcha'), state: 'error' });
      await requestCaptchaPrompt();
      return;
    }

    const values = {
      email: cleanValue(formData.email),
      message: cleanValue(formData.message),
      name: cleanValue(formData.name),
      project: cleanValue(formData.project),
    };
    const subjectDetail = values.project || values.name;
    const subject = subjectDetail ? `${subjectPrefix}: ${subjectDetail}` : subjectPrefix;
    const requestData = new FormData(event.currentTarget);

    requestData.set('access_key', WEB3FORMS_ACCESS_KEY);
    requestData.set('subject', subject);
    requestData.set('from_name', values.name);
    requestData.set('name', values.name);
    requestData.set('email', values.email);
    requestData.set('project', values.project);
    requestData.set('message', values.message);
    requestData.set('h-captcha-response', captchaToken);
    requestData.delete('g-recaptcha-response');

    setSubmitStatus({ message: t('contact.statusSending'), state: 'sending' });

    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        body: requestData,
        method: 'POST',
      });
      const data = await response.json().catch(() => ({ success: false }));

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Contact form submission failed.');
      }

      setFormData(initialFormState);
      resetCaptcha();
      setSubmitStatus({ message: t('contact.statusSuccess'), state: 'success' });
    } catch {
      resetCaptcha();
      setSubmitStatus({ message: t('contact.statusError'), state: 'error' });
    }
  }

  return (
    <form
      action={WEB3FORMS_ENDPOINT}
      className="contact-form"
      method="post"
      onSubmit={handleSubmit}
    >
      <input name="access_key" type="hidden" value={WEB3FORMS_ACCESS_KEY} />
      <input name="subject" type="hidden" value={subjectPrefix} />
      <input autoComplete="off" className="contact-form__honeypot" name="botcheck" tabIndex="-1" type="checkbox" />
      <TextInput
        autoComplete="name"
        id="contact-name"
        label={fields.name.label}
        name="name"
        onChange={updateField}
        placeholder={fields.name.placeholder}
        required
        value={formData.name}
      />
      <TextInput
        autoComplete="email"
        id="contact-email"
        inputMode="email"
        label={fields.email.label}
        name="email"
        onChange={updateField}
        placeholder={fields.email.placeholder}
        required
        type="email"
        value={formData.email}
      />
      <TextInput
        autoComplete="organization-title"
        id="contact-project"
        label={fields.project.label}
        name="project"
        onChange={updateField}
        placeholder={fields.project.placeholder}
        required
        value={formData.project}
      />
      <TextInput
        autoComplete="off"
        id="contact-message"
        label={fields.message.label}
        multiline
        name="message"
        onChange={updateField}
        placeholder={fields.message.placeholder}
        required
        value={formData.message}
      />
      <Button disabled={isSubmitting} type="submit" variant="inverse">
        {isSubmitting ? t('contact.statusSendingShort') : t('cta.sendInquiry')}
      </Button>
      <div className="contact-form__captcha">
        {isClient ? (
          <HCaptcha
            languageOverride={i18n.resolvedLanguage === 'de' ? 'de' : 'en'}
            onError={resetCaptcha}
            onExpire={resetCaptcha}
            onVerify={setCaptchaToken}
            ref={captchaRef}
            sitekey={HCAPTCHA_SITE_KEY}
            theme="dark"
          />
        ) : null}
      </div>
      <p aria-live="polite" className={`contact-form__status contact-form__status--${submitStatus.state}`} role="status">
        {submitStatus.message}
      </p>
    </form>
  );
}
