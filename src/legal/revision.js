const months = {
  january: 1, januar: 1, february: 2, februar: 2, march: 3, märz: 3,
  april: 4, may: 5, mai: 5, june: 6, juni: 6, july: 7, juli: 7,
  august: 8, september: 9, october: 10, oktober: 10, november: 11,
  december: 12, dezember: 12,
};

/** A document-authored revision is independent of checkout, build and commit dates. */
export function readLegalRevision(markdown) {
  const lines = markdown.split(/\r?\n/).slice(0, 12);
  const line = lines.find(value => /^(?:\*\*)?(?:Stand|Last updated):/i.test(value));
  if (!line) return null;
  const value = line.replace(/^\*\*|\*\*$/g, '').replace(/^(?:Stand|Last updated):\s*/i, '').trim();
  const numeric = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const words = /^(\d{1,2})\.?\s+([\p{L}]+)\s+(\d{4})$/u.exec(value);
  const year = Number(numeric?.[1] ?? words?.[3]);
  const month = Number(numeric?.[2] ?? months[words?.[2]?.toLowerCase()]);
  const day = Number(numeric?.[3] ?? words?.[1]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (!Number.isInteger(year) || year < 1000 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error(`Invalid authored legal revision: ${value}`);
  }
  return { date: date.toISOString().slice(0, 10), line };
}

export function omitLegalRevision(markdown) {
  const revision = readLegalRevision(markdown);
  if (!revision) return markdown;
  // Remove only the identified preamble line; all substantive paragraphs remain.
  const lines = markdown.split(/\r?\n/);
  lines.splice(lines.indexOf(revision.line), 1);
  return lines.join('\n');
}
