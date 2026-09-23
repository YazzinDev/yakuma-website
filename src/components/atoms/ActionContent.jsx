/** Shared native geometry for POQTa / M880sB links and form buttons. */
export default function ActionContent({ children, enclosed = true, tone = 'primary' }) {
  return <>
    {enclosed && <span className="action-link__corners" aria-hidden="true"><i /><i /><i /><i /></span>}
    <span className="action-link__body">
      {tone === 'secondary' && <svg className="action-link__outline" aria-hidden="true" viewBox="0 0 260 60" preserveAspectRatio="none"><path d="M1 1h247l11 11v47h-247l-11-11z" /></svg>}
      <span className="action-link__label">{children}</span>
      {tone === 'primary' && <svg className="action-link__arrow" aria-hidden="true" viewBox="0 0 24 16"><path d="M1 8h21m-7-7l7 7-7 7" /></svg>}
    </span>
  </>;
}
