import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { buildStaticRoutes } from '../src/routes/localizedPaths.js';

const rootDir = resolve(import.meta.dirname, '..');
const distDir = resolve(rootDir, 'dist');

async function copyHtml(sourcePath, targetPath) {
  await mkdir(dirname(targetPath), { recursive: true });
  await copyFile(sourcePath, targetPath);
}

function keepPreload(link, route) {
  if (/rel="modulepreload"/.test(link) && /heroGlobeScene-/.test(link)) return false;
  if (/rel="preload"/.test(link) && /as="image"/.test(link)) {
    return /\/assets\/globe-first-frame-(?:desktop|mobile)-[^"/]+\.png/.test(link)
      || (/^\/(?:de|en)\/games\/hoshi(?:\/download)?$/.test(route)
        && /\/assets\/EraVR-[^"/]+\.webp/.test(link));
  }
  return true;
}

async function optimizeStaticRoute(routePath, route) {
  const source = await readFile(routePath, 'utf8');
  const optimized = source
    .replace(/<noscript><meta http-equiv="refresh" content="0;url=\/en"\s*\/?><\/noscript>/g, '')
    .replace(/<link\b[^>]*>/g, link => {
      if (!keepPreload(link, route)) return '';
      if (/rel="preload"/.test(link) && /as="image"/.test(link) && /\/assets\/globe-first-frame-(?:desktop|mobile)-[^"/]+\.png/.test(link)) {
        const media = /\/assets\/globe-first-frame-mobile-/.test(link) ? '(max-width: 1100px)' : '(min-width: 1101px)';
        return link.replace(/>$/, ` fetchpriority="high" media="${media}">`);
      }
      return link;
    });
  if (source !== optimized) {
    await writeFile(routePath, optimized, 'utf8');
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
  await optimizeStaticRoute(sourcePath, route);
  await copyHtml(sourcePath, routeIndexPath(route));
}

await copyHtml(resolve(distDir, 'de', '404.html'), resolve(distDir, '404.html'));
