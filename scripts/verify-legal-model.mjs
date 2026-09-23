import assert from 'node:assert/strict';
import { buildLegalDocumentModel } from '../src/legal/documentModel.js';

const source = '# Title\n\nIntroduction.\n\n## Über uns\n\nFirst.\n\n## Über uns\n\nSecond.\n\n### Details\n\n| Data | Purpose |\n| --- | --- |\n| Email | Contact |';
const model = buildLegalDocumentModel(source);
assert.deepEqual(model.contents.map(item => item.id), ['document-uber-uns', 'document-uber-uns-2']);
assert.equal(model.blocks[0].type, 'paragraph');
assert.equal(model.blocks[0].lines[0].text, 'Introduction.');
for (const item of model.contents) assert.equal(model.blocks.filter(block => block.id === item.id).length, 1);
const table = model.blocks.find(block => block.type === 'table');
assert.equal(table.labelledBy, 'document-details');
assert.deepEqual(table.rows, [['Email', 'Contact']]);
assert.deepEqual(buildLegalDocumentModel('Plain paragraph').contents, []);
assert.deepEqual(buildLegalDocumentModel(source), model, 'Anchor IDs must be stable across renders');
const address = buildLegalDocumentModel('First line\\\nSecond line').blocks[0].lines;
assert.deepEqual(address, [{ text: 'First line', hardBreak: true }, { text: 'Second line', hardBreak: false }]);
console.log('Legal document model checks passed.');
