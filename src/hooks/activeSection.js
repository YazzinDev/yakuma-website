/** Select by the line below the sticky header, never by nearest distance. */
export function selectActiveSection(sections, { activationY, viewportHeight, atBottom }) {
  if (!sections.length) return '';
  if (atBottom) {
    const last = sections.at(-1);
    if (last.top < viewportHeight && last.bottom > activationY) return last.id;
  }
  return sections.find(({ top, bottom }) => top <= activationY && bottom > activationY)?.id ?? '';
}
