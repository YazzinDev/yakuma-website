import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const legalRoot = join(projectRoot, 'src', 'legal');
const outputPath = join(legalRoot, 'documentDates.generated.js');

function collectMarkdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) return collectMarkdownFiles(entryPath);
    return entry.isFile() && entry.name.endsWith('.md') ? [entryPath] : [];
  });
}

function getDocumentDate(filePath) {
  const fileRelativePath = relative(projectRoot, filePath);

  try {
    const lastCommitDate = execFileSync('git', ['log', '-1', '--format=%aI', '--', fileRelativePath], {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    if (/^\d{4}-\d{2}-\d{2}T/.test(lastCommitDate)) {
      return lastCommitDate.slice(0, 10);
    }
  } catch {
    // Uncommitted documents use their own modification time until they are committed.
  }

  return statSync(filePath).mtime.toISOString().slice(0, 10);
}

function addDocumentDate(dates, filePath) {
  const relativeSegments = relative(legalRoot, filePath).split(sep);
  const [scope, language, fileName] = relativeSegments;
  const suffix = `-${language}.md`;
  const documentType = fileName.slice(`${scope}-`.length, -suffix.length);

  dates[scope] ??= {};
  dates[scope][language] ??= {};
  dates[scope][language][documentType] = getDocumentDate(filePath);
}

const legalDocumentDates = {};
collectMarkdownFiles(legalRoot).forEach((filePath) => addDocumentDate(legalDocumentDates, filePath));

writeFileSync(
  outputPath,
  `// Generated during development and production builds. Do not edit manually.\nexport const legalDocumentDates = ${JSON.stringify(legalDocumentDates, null, 2)};\n`,
);
