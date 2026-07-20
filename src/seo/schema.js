export function buildFaqPageSchema({ items, language, routePath }) {
  return {
    '@id': `${routePath}#faq`,
    '@type': 'FAQPage',
    inLanguage: language,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
      name: item.question,
    })),
    url: routePath,
  };
}

export function buildHoshiDownloadSchema({ description, image, language, routePath, storeLinks }) {
  const downloadUrls = Object.values(storeLinks).filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@id': `${routePath}#webpage`,
        '@type': 'WebPage',
        description,
        image,
        inLanguage: language,
        name: 'Download Hoshi: Star Sudoku',
        url: routePath,
      },
      {
        '@id': `${routePath}#application`,
        '@type': 'MobileApplication',
        applicationCategory: 'GameApplication',
        description,
        downloadUrl: downloadUrls.length > 0 ? downloadUrls : undefined,
        image,
        name: 'Hoshi: Star Sudoku',
        operatingSystem: ['iOS', 'Android'],
        publisher: {
          '@id': `/${language}#organization`,
          '@type': 'Organization',
          name: 'Yakuma',
          url: `/${language}`,
        },
        url: routePath,
      },
    ],
  };
}
