import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { readLegalRevision, omitLegalRevision } from '../src/legal/revision.js';
import { legalDocumentDates } from '../src/legal/documentDates.generated.js';

const sources = JSON.parse(readFileSync(new URL('../docs/implementation/yakuma-privacy-sources.json', import.meta.url), 'utf8'));
for (const [language, source] of Object.entries(sources)) {
  const bytes = readFileSync(new URL(`../${source.target}`, import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), source.importedSha256, `${language}: update the import audit when content changes`);
  const markdown = bytes.toString('utf8');
  const revision = readLegalRevision(markdown);
  assert.equal(revision.date, source.declaredRevision);
  assert.equal(legalDocumentDates.yakuma[language]['privacy-policy'], revision.date);
  const headings = [...markdown.matchAll(/^## (\d+)\./gm)].map(match => Number(match[1]));
  assert.deepEqual(headings, Array.from({ length: 14 }, (_, index) => index + 1));
  assert.deepEqual(omitLegalRevision(markdown).split('\n'), markdown.replace(/\r\n/g, '\n').split('\n').filter(line => line !== revision.line));
}

for (const value of ['Stand: 29. Februar 2024', '**Last updated: 29 February 2024**', 'Last updated: 2024-02-29']) {
  assert.equal(readLegalRevision(`# Title\n\n${value}\n\nBody`).date, '2024-02-29');
}
for (const value of ['29 February 2023', '31 April 2026', '2026-13-01', '22 Unknown 2026', '2026-00-01', '2026-09-00']) {
  assert.throws(() => readLegalRevision(`Last updated: ${value}`), /Invalid authored legal revision/);
}
const undated = '# Document\n\nNo authored revision.';
assert.equal(readLegalRevision(undated), null);
assert.equal(omitLegalRevision(undated), undated);
const bodyMention = `${'\n'.repeat(12)}Last updated: 2024-02-29`;
assert.equal(readLegalRevision(bodyMention), null, 'Body text must not become document metadata');
console.log('Legal revision and privacy import checks passed.');
