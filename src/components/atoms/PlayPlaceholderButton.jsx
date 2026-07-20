export default function PlayPlaceholderButton({ href, label }) {
  const content = <span aria-hidden="true" />;

  if (href) {
    return (
      <a
        aria-label={label}
        className="play-placeholder-button play-placeholder-button--link"
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {content}
      </a>
    );
  }

  return (
    <button aria-label={label} className="play-placeholder-button" disabled title={label} type="button">
      {content}
    </button>
  );
}
