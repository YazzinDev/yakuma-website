export default function StoreBadge({ href, label, pendingLabel, small, store }) {
  const content = (
    <>
      <span>{small}</span>
      <strong className={href ? 'link-underline-target__text' : undefined}>{label}</strong>
    </>
  );

  if (href) {
    return (
      <a
        className="store-badge store-badge--link link-underline-target"
        data-store={store}
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {content}
      </a>
    );
  }

  return (
    <span
      aria-disabled="true"
      aria-label={`${label} - ${pendingLabel}`}
      className="store-badge store-badge--pending"
      data-state="pending"
      data-store={store}
      data-reveal-opacity="0.76"
      title={pendingLabel}
    >
      {content}
    </span>
  );
}
