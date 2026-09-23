import appStoreBadge from '../../assets/pencil-hoshi/app-store.png';
import googlePlayBadge from '../../assets/pencil-hoshi/google-play-aligned.png';

const badgeImages = {
  'app-store': appStoreBadge,
  'google-play': googlePlayBadge,
};

export default function StoreBadge({ href, label, pendingLabel, small, store }) {
  const content = (
    <img alt={`${small} ${label}`} className="store-badge__image" src={badgeImages[store]} />
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
      title={pendingLabel}
    >
      {content}
    </span>
  );
}
