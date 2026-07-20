export function parseLegalMarkdown(markdown) {
  const blocks = [];
  let paragraph = [];
  let list = [];
  let listType = 'unordered';
  let quote = [];

  function flushParagraph() {
    if (paragraph.length > 0) {
      blocks.push({ type: 'paragraph', lines: paragraph });
      paragraph = [];
    }
  }

  function flushList() {
    if (list.length > 0) {
      blocks.push({ type: listType === 'ordered' ? 'ordered-list' : 'list', items: list });
      list = [];
      listType = 'unordered';
    }
  }

  function flushQuote() {
    if (quote.length > 0) {
      blocks.push({ type: 'blockquote', lines: quote });
      quote = [];
    }
  }

  function parseTableRow(line) {
    const trimmed = line.trim();

    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) {
      return null;
    }

    return trimmed
      .slice(1, -1)
      .split('|')
      .map((cell) => cell.trim());
  }

  function isTableSeparator(line, columnCount) {
    const cells = parseTableRow(line);
    return cells?.length === columnCount && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
  }

  const lines = markdown.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const hasHardBreak = / {2,}$/.test(rawLine);
    const line = rawLine.trimEnd();
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    const horizontalRule = /^\s{0,3}(?:---+|\*\*\*+|___+)\s*$/.exec(line);
    const blockquote = /^>\s?(.*)$/.exec(line);
    const listItem = /^[-*]\s+(.*)$/.exec(line);
    const orderedListItem = /^\d+[.)]\s+(.*)$/.exec(line);
    const tableHeader = parseTableRow(line);

    if (tableHeader && isTableSeparator(lines[index + 1] ?? '', tableHeader.length)) {
      flushParagraph();
      flushList();
      flushQuote();

      const rows = [];
      index += 2;
      while (index < lines.length) {
        const row = parseTableRow(lines[index]);
        if (!row || row.length !== tableHeader.length) {
          index -= 1;
          break;
        }
        rows.push(row);
        index += 1;
      }

      blocks.push({ type: 'table', headers: tableHeader, rows });
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      flushQuote();
      continue;
    }

    if (horizontalRule) {
      flushParagraph();
      flushList();
      flushQuote();
      blocks.push({ type: 'separator' });
      continue;
    }

    if (heading) {
      flushParagraph();
      flushList();
      flushQuote();
      blocks.push({
        type: `h${heading[1].length}`,
        text: heading[2],
      });
      continue;
    }

    if (blockquote) {
      flushParagraph();
      flushList();
      quote.push({ text: blockquote[1], hardBreak: hasHardBreak });
      continue;
    }

    if (listItem) {
      flushParagraph();
      flushQuote();
      if (listType !== 'unordered') {
        flushList();
      }
      listType = 'unordered';
      list.push(listItem[1]);
      continue;
    }

    if (orderedListItem) {
      flushParagraph();
      flushQuote();
      if (listType !== 'ordered') {
        flushList();
      }
      listType = 'ordered';
      list.push(orderedListItem[1]);
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push({ text: line, hardBreak: hasHardBreak });
  }

  flushParagraph();
  flushList();
  flushQuote();

  return blocks;
}
