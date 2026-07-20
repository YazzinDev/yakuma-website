import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getLegalFileName, isPendingLegalDocument } from '../src/legal/metadata.js';
import { buildStaticRoutes, legalDocuments, neutralRouteAliases, supportedLanguages } from '../src/routes/localizedPaths.js';

export function getLegalEntries(rootDir) {
  return Object.entries(legalDocuments).flatMap(([scope, docTypes]) =>
    supportedLanguages.flatMap((language) =>
      docTypes.map((docType) => {
        const markdownPath = resolve(
          rootDir,
          'src',
          'legal',
          scope,
          language,
          getLegalFileName(scope, language, docType),
        );
        const markdown = existsSync(markdownPath) ? readFileSync(markdownPath, 'utf8') : '';
        const prefix = scope === 'hoshi' ? 'games/hoshi/legal' : 'legal';

        return {
          docType,
          language,
          markdown,
          markdownPath,
          pending: isPendingLegalDocument(markdown),
          route: `/${language}/${prefix}/${docType}`,
          scope,
        };
      }),
    ),
  );
}

export function buildIndexableRoutes(rootDir) {
  const pendingLegalRoutes = new Set(
    getLegalEntries(rootDir)
      .filter((entry) => entry.pending)
      .map((entry) => entry.route),
  );

  const neutralAliasPaths = new Set(neutralRouteAliases.map(({ path }) => path));

  return buildStaticRoutes().filter(
    (route) => !pendingLegalRoutes.has(route) && !route.endsWith('/404') && !neutralAliasPaths.has(route),
  );
}
