import { Head } from 'vite-react-ssg';
import { siteName, siteUrl } from '../../config/site.js';
import { defaultLanguage, supportedLanguages } from '../../i18n/languages.js';
import { getAlternateLanguagePath } from '../../routes/localizedPaths';

const localeMap = {
  de: 'de_DE',
  en: 'en_US',
};

function absoluteUrl(value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${siteUrl}${value.startsWith('/') ? value : `/${value}`}`;
}

function normalizeStructuredData(value) {
  if (Array.isArray(value)) return value.map(normalizeStructuredData);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normalizeStructuredData(entry)]),
    );
  }
  if (typeof value === 'string' && value.startsWith('/')) return absoluteUrl(value);
  return value;
}

function serializeStructuredData(data) {
  return JSON.stringify(normalizeStructuredData(data)).replace(/</g, '\\u003c');
}

function normalizeAlternateLanguages(alternateLanguages) {
  return [...new Set(alternateLanguages)].filter((targetLanguage) => supportedLanguages.includes(targetLanguage));
}

export default function PageMeta({
  alternateLanguages = supportedLanguages,
  description,
  image,
  imageAlt,
  language,
  noIndex = false,
  path,
  structuredData,
  title,
}) {
  const canonicalPath = path || `/${language}`;
  const canonicalUrl = `${siteUrl}${canonicalPath}`;
  const imageUrl = absoluteUrl(image);
  const socialImageAlt = imageAlt || title;
  const visibleAlternateLanguages = noIndex ? [] : normalizeAlternateLanguages(alternateLanguages);
  const shouldRenderAlternates = visibleAlternateLanguages.length > 1;
  const xDefaultLanguage = visibleAlternateLanguages.includes(defaultLanguage)
    ? defaultLanguage
    : visibleAlternateLanguages[0];

  return (
    <Head>
      <html lang={language} />
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      {noIndex ? <meta name="robots" content="noindex, nofollow" /> : null}
      <link rel="canonical" href={canonicalUrl} />
      {shouldRenderAlternates
        ? visibleAlternateLanguages.map((targetLanguage) => (
            <link
              href={`${siteUrl}${getAlternateLanguagePath(canonicalPath, targetLanguage)}`}
              hrefLang={targetLanguage}
              key={targetLanguage}
              rel="alternate"
            />
          ))
        : null}
      {shouldRenderAlternates ? (
        <link
          href={`${siteUrl}${getAlternateLanguagePath(canonicalPath, xDefaultLanguage)}`}
          hrefLang="x-default"
          rel="alternate"
        />
      ) : null}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={localeMap[language] ?? language} />
      {shouldRenderAlternates
        ? visibleAlternateLanguages
            .filter((targetLanguage) => targetLanguage !== language)
            .map((targetLanguage) => (
              <meta
                content={localeMap[targetLanguage] ?? targetLanguage}
                key={targetLanguage}
                property="og:locale:alternate"
              />
            ))
        : null}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {imageUrl ? <meta property="og:image" content={imageUrl} /> : null}
      {imageUrl ? <meta property="og:image:alt" content={socialImageAlt} /> : null}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {imageUrl ? <meta name="twitter:image" content={imageUrl} /> : null}
      {imageUrl ? <meta name="twitter:image:alt" content={socialImageAlt} /> : null}
      {structuredData ? (
        <script type="application/ld+json">{serializeStructuredData(structuredData)}</script>
      ) : null}
    </Head>
  );
}
