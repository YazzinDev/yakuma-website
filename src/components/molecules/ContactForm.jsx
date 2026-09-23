import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HCAPTCHA_SITE_KEY, WEB3FORMS_ACCESS_KEY, WEB3FORMS_ENDPOINT } from '../../config/contactForm';
import Button from '../atoms/Button';
import ActionButton from '../atoms/ActionButton';
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

export default function ContactForm({ variant = 'legacy' }) {
  const { i18n, t } = useTranslation('common');
  const fields = t('contact.fields', { returnObjects: true });
  const subjectPrefix = t('contact.subjectPrefix');
  const captchaRef = useRef(null);
  const captchaTokenRef = useRef('');
  const formRef = useRef(null);
  const requestRef = useRef(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState(initialFormState);
  const [isClient, setIsClient] = useState(false);
  const [shouldLoadCaptcha, setShouldLoadCaptcha] = useState(false);
  const [CaptchaComponent, setCaptchaComponent] = useState(null);
  const [submitStatus, setSubmitStatus] = useState({ messageKey: '', state: 'idle' });
  const isSubmitting = submitStatus.state === 'sending';
  const SubmitButton = variant === 'pencil' ? ActionButton : Button;

  async function requestCaptchaPrompt() {
    setShouldLoadCaptcha(true);
    const captcha = captchaRef.current;

    formRef.current?.querySelector('.contact-form__captcha')?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });

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
    return () => {
      window.clearTimeout(timer);
      requestRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!isClient || shouldLoadCaptcha) return undefined;
    const target = formRef.current?.querySelector('.contact-form__captcha');
    if (!target || !window.IntersectionObserver) {
      const timer = window.setTimeout(() => setShouldLoadCaptcha(true), 0);
      return () => window.clearTimeout(timer);
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setShouldLoadCaptcha(true);
    }, { rootMargin: '400px 0px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, [isClient, shouldLoadCaptcha]);

  useEffect(() => {
    if (!shouldLoadCaptcha) return undefined;
    let active = true;
    import('@hcaptcha/react-hcaptcha')
      .then(({ default: component }) => {
        if (active) setCaptchaComponent(() => component);
      })
      .catch(() => {
        if (active) {
          captchaTokenRef.current = '';
          setSubmitStatus(current => current.state === 'sending' || current.state === 'success'
            ? current
            : { messageKey: 'contact.statusCaptchaUnavailable', state: 'error' });
        }
      });
    return () => { active = false; };
  }, [shouldLoadCaptcha]);

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setFieldErrors(current => ({ ...current, [name]: undefined }));
    if (submitStatus.messageKey) {
      setSubmitStatus({ messageKey: '', state: 'idle' });
    }
  }

  function handleInvalid(event) {
    event.preventDefault();
    const control = event.currentTarget;
    setFieldErrors(current => ({ ...current, [control.name]: t(control.validity.typeMismatch ? 'contact.invalidEmail' : 'contact.requiredField') }));
    control.form?.querySelector(':invalid')?.focus();
  }

  function fieldFeedback(name) {
    return { error: fieldErrors[name], onInvalid: handleInvalid, showRequired: variant === 'pencil' };
  }

  function resetCaptcha() {
    captchaRef.current?.resetCaptcha();
    captchaTokenRef.current = '';
  }

  function handleCaptchaVerify(token) {
    captchaTokenRef.current = token;
    setSubmitStatus(current => current.state === 'error' ? { messageKey: '', state: 'idle' } : current);
  }

  function handleCaptchaError() {
    resetCaptcha();
    setSubmitStatus(current => current.state === 'sending' || current.state === 'success'
      ? current
      : { messageKey: 'contact.statusCaptchaUnavailable', state: 'error' });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (requestRef.current || isSubmitting) return;

    const values = {
      email: cleanValue(formData.email),
      message: cleanValue(formData.message),
      name: cleanValue(formData.name),
      project: cleanValue(formData.project),
    };
    const blankFields = Object.keys(values).filter(name => !values[name]);
    if (blankFields.length) {
      setFieldErrors(Object.fromEntries(blankFields.map(name => [name, t('contact.requiredField')])));
      formRef.current?.elements.namedItem(blankFields[0])?.focus();
      return;
    }
    if (!captchaTokenRef.current) {
      setSubmitStatus({ messageKey: 'contact.statusCaptcha', state: 'error' });
      await requestCaptchaPrompt();
      return;
    }
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
    requestData.set('h-captcha-response', captchaTokenRef.current);
    requestData.delete('g-recaptcha-response');

    setSubmitStatus({ messageKey: 'contact.statusSending', state: 'sending' });
    const request = new AbortController();
    requestRef.current = request;

    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        body: requestData,
        method: 'POST',
        signal: request.signal,
      });
      const data = await response.json().catch(() => ({ success: false }));
      if (request.signal.aborted) return;

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Contact form submission failed.');
      }

      setFormData(initialFormState);
      resetCaptcha();
      setSubmitStatus({ messageKey: 'contact.statusSuccess', state: 'success' });
    } catch {
      if (request.signal.aborted) return;
      resetCaptcha();
      setSubmitStatus({ messageKey: 'contact.statusError', state: 'error' });
    } finally {
      if (requestRef.current === request) requestRef.current = null;
    }
  }

  return (
    <form
      action={WEB3FORMS_ENDPOINT}
      className={`contact-form contact-form--${variant}`}
      method="post"
      onSubmit={handleSubmit}
      ref={formRef}
      aria-busy={isSubmitting}
    >
      <input name="access_key" type="hidden" value={WEB3FORMS_ACCESS_KEY} />
      <input name="subject" type="hidden" value={subjectPrefix} />
      <input autoComplete="off" className="contact-form__honeypot" name="botcheck" tabIndex="-1" type="checkbox" hidden aria-hidden="true" />
      <TextInput
        {...fieldFeedback('name')}
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
        {...fieldFeedback('email')}
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
        {...fieldFeedback('project')}
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
        {...fieldFeedback('message')}
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
      <div className="contact-form__captcha">
        <div className="contact-form__captcha-widget">
        {isClient && CaptchaComponent ? (
          <CaptchaComponent
            languageOverride={i18n.resolvedLanguage === 'de' ? 'de' : 'en'}
            onError={handleCaptchaError}
            onExpire={resetCaptcha}
            onVerify={handleCaptchaVerify}
            ref={captchaRef}
            sitekey={HCAPTCHA_SITE_KEY}
            theme="dark"
          />
        ) : null}
        </div>
      </div>
      <SubmitButton disabled={isSubmitting} type="submit" variant="inverse">
        {isSubmitting ? t('contact.statusSendingShort') : t('cta.sendInquiry')}
      </SubmitButton>
      <p aria-live="polite" className={`contact-form__status contact-form__status--${submitStatus.state}`} role="status">
        {submitStatus.messageKey ? t(submitStatus.messageKey) : null}
      </p>
    </form>
  );
}
