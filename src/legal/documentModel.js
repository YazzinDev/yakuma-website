import { parseLegalMarkdown } from './markdown.js';

/** One model supplies both rendered headings and their navigation destinations. */
export function buildLegalDocumentModel(markdown) {
  const used = new Set();
  const blocks = parseLegalMarkdown(markdown).filter((block, index) => !(index === 0 && block.type === 'h1'));
  const contents = [];
  let tableHeading = null;
  for (const block of blocks) {
    if (/^h[1-4]$/.test(block.type)) {
      const stem = block.text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'section';
      let id = `document-${stem}`;
      let suffix = 2;
      while (used.has(id)) id = `document-${stem}-${suffix++}`;
      used.add(id);
      block.id = id;
      tableHeading = id;
      if (block.type === 'h2') contents.push({ id, text: block.text });
    }
    if (block.type === 'table') block.labelledBy = tableHeading;
  }
  return { blocks, contents };
}
