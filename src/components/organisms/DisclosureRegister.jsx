import LegalDocument from './LegalDocument';

// Keep the source Markdown as the content authority, including additional sections.
function splitDisclosure(model) {
  const sections = [];
  for (const block of model.blocks) {
    if (block.type === 'h2') sections.push({ heading: block, blocks: [] });
    else {
      if (!sections.length) sections.push({ heading: null, blocks: [] });
      sections.at(-1).blocks.push(block);
    }
  }
  return sections;
}

export default function DisclosureRegister({ model, language, scope = 'yakuma' }) {
  const sections = splitDisclosure(model);
  const providerHeading = scope === 'hoshi'
    ? language === 'de' ? 'Diensteanbieter' : 'Service provider'
    : language === 'de' ? 'DIENSTEANBIETER' : 'PROVIDER';
  const taxSection = sections[2];
  const lastBlock = taxSection?.blocks.at(-1);
  const hasTaxNote = lastBlock?.type === 'paragraph' && lastBlock.lines.length === 1 && /^\*\*\*/.test(lastBlock.lines[0].text);
  if (hasTaxNote) taxSection.blocks = taxSection.blocks.slice(0, -1);
  return <><div className="disclosure-register">
    {sections.slice(0, 3).map((section, index) => <section className="disclosure-register__block" key={section.heading?.id ?? index}>
      <span className="disclosure-register__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <h2 id={section.heading?.id}>{index === 0 ? providerHeading : section.heading?.text}</h2>
      <LegalDocument language={language} model={{ blocks: section.blocks }} />
    </section>)}
  </div>{hasTaxNote && <div className="disclosure-register__tax-note"><LegalDocument language={language} model={{ blocks: [lastBlock] }} /></div>}
  {scope === 'hoshi' && sections.slice(3).map(section => <section className="disclosure-register__app" key={section.heading?.id}>
    <h2 id={section.heading?.id}>{section.heading?.text}</h2>
    <LegalDocument language={language} model={{ blocks: section.blocks }} />
  </section>)}</>;
}
