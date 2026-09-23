export default function DocumentContents({ items, language }) {
  if (!items.length) return null;
  return (
    <nav className="document-contents" aria-label={language === 'de' ? 'Auf dieser Seite' : 'On this page'}>
      <p className="document-contents__title">{language === 'de' ? 'AUF DIESER SEITE' : 'ON THIS PAGE'}</p>
      <ol>
        {items.map(item => <li key={item.id}><a href={`#${item.id}`}>{item.text}</a></li>)}
      </ol>
    </nav>
  );
}
