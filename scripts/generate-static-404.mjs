import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { buildStaticRoutes } from '../src/routes/localizedPaths.js';

const rootDir = resolve(import.meta.dirname, '..');
const distDir = resolve(rootDir, 'dist');

async function copyHtml(sourcePath, targetPath) {
  await mkdir(dirname(targetPath), { recursive: true });
  await copyFile(sourcePath, targetPath);
}

async function removeRootRedirectFromStaticRoute(routePath) {
  const source = await readFile(routePath, 'utf8');
  const withoutRootRedirect = source.replace(
    /<noscript><meta http-equiv="refresh" content="0;url=\/en"\s*\/?><\/noscript>/g,
    '',
  );
  if (source !== withoutRootRedirect) {
    await writeFile(routePath, withoutRootRedirect, 'utf8');
  }
}

function routeSourcePath(route) {
  const cleanRoute = route.replace(/^\//, '');
  return resolve(distDir, `${cleanRoute}.html`);
}

function routeIndexPath(route) {
  const cleanRoute = route.replace(/^\//, '');
  return resolve(distDir, cleanRoute, 'index.html');
}

for (const route of buildStaticRoutes()) {
  const sourcePath = routeSourcePath(route);
  await removeRootRedirectFromStaticRoute(sourcePath);
  await copyHtml(sourcePath, routeIndexPath(route));
}

await copyHtml(resolve(distDir, 'de', '404.html'), resolve(distDir, '404.html'));
