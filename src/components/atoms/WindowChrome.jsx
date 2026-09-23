/** Decorative application chrome; these marks are not fake actionable controls. */
export default function WindowChrome({ filename }) {
  return <div className="window-chrome">
    <svg className="window-chrome__file" aria-hidden="true" viewBox="0 0 18 20"><path d="M2 1h9l5 5v13h-14z m9 0v5h5m-11 4h7m-7 4h5" /></svg>
    <span>{filename}</span>
    <svg className="window-chrome__controls" aria-hidden="true" viewBox="0 0 108 32"><path d="M9 21h14 M46 9h13v13h-13z M82 10l12 12m0-12l-12 12" /></svg>
  </div>;
}
