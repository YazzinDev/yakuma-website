import hoshiLegalDisclosureDe from './hoshi/de/hoshi-legal-disclosure-de.md?raw';
import hoshiPrivacyPolicyDe from './hoshi/de/hoshi-privacy-policy-de.md?raw';
import hoshiTermsOfServiceDe from './hoshi/de/hoshi-terms-of-service-de.md?raw';
import hoshiLegalDisclosureEn from './hoshi/en/hoshi-legal-disclosure-en.md?raw';
import hoshiPrivacyPolicyEn from './hoshi/en/hoshi-privacy-policy-en.md?raw';
import hoshiTermsOfServiceEn from './hoshi/en/hoshi-terms-of-service-en.md?raw';
import yakumaLegalDisclosureDe from './yakuma/de/yakuma-legal-disclosure-de.md?raw';
import yakumaPrivacyPolicyDe from './yakuma/de/yakuma-privacy-policy-de.md?raw';
import yakumaLegalDisclosureEn from './yakuma/en/yakuma-legal-disclosure-en.md?raw';
import yakumaPrivacyPolicyEn from './yakuma/en/yakuma-privacy-policy-en.md?raw';
export { isPendingLegalDocument, legalTitles } from './metadata.js';

export const legalRegistry = {
  hoshi: {
    de: {
      'legal-disclosure': hoshiLegalDisclosureDe,
      'privacy-policy': hoshiPrivacyPolicyDe,
      'terms-of-service': hoshiTermsOfServiceDe,
    },
    en: {
      'legal-disclosure': hoshiLegalDisclosureEn,
      'privacy-policy': hoshiPrivacyPolicyEn,
      'terms-of-service': hoshiTermsOfServiceEn,
    },
  },
  yakuma: {
    de: {
      'legal-disclosure': yakumaLegalDisclosureDe,
      'privacy-policy': yakumaPrivacyPolicyDe,
    },
    en: {
      'legal-disclosure': yakumaLegalDisclosureEn,
      'privacy-policy': yakumaPrivacyPolicyEn,
    },
  },
};

export function getLegalDocument(scope, language, docType) {
  const document = legalRegistry[scope]?.[language]?.[docType];

  if (typeof document !== 'string' || document.trim().length === 0) {
    throw new Error(`Missing legal document for ${scope}/${language}/${docType}`);
  }

  return document;
}
