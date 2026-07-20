import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { siteUrl } from '../src/config/site.js';

const rootDir = resolve(import.meta.dirname, '..');
const robotsPath = resolve(rootDir, 'public', 'robots.txt');

const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

await mkdir(dirname(robotsPath), { recursive: true });
await writeFile(robotsPath, robots, 'utf8');
