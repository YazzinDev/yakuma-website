export const legalTitles = {
  'legal-disclosure': {
    de: 'IMPRESSUM',
    en: 'LEGAL DISCLOSURE',
  },
  'privacy-policy': {
    de: 'DATENSCHUTZERKLÄRUNG',
    en: 'PRIVACY POLICY',
  },
  'terms-of-service': {
    de: 'NUTZUNGSBEDINGUNGEN',
    en: 'TERMS OF SERVICE',
  },
};

export const pendingLegalTitles = new Set([
  'Legal document pending',
  'Rechtliches Dokument ausstehend',
]);

export function getLegalDocumentTitle(markdown) {
  const heading = /^#\s+(.+)$/m.exec(markdown ?? '');
  return heading?.[1]?.trim() ?? '';
}

export function isPendingLegalDocument(markdown) {
  return pendingLegalTitles.has(getLegalDocumentTitle(markdown));
}

export function getLegalFileName(scope, language, docType) {
  return `${scope}-${docType}-${language}.md`;
}
