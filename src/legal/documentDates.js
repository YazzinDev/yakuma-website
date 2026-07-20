import { legalDocumentDates } from './documentDates.generated.js';

const englishMonthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function getLegalDocumentDate(scope, language, documentType) {
  return legalDocumentDates[scope]?.[language]?.[documentType] ?? null;
}

export function formatLegalDocumentDate(date, language) {
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date ?? '');
  if (!dateParts) return date;

  const [, year, month, day] = dateParts;
  if (language === 'de') return `${day}.${month}.${year}`;
  return `${day} ${englishMonthNames[Number(month) - 1]} ${year}`;
}
