export default function SocialProfileLink({ className, href, label, pendingLabel, profile }) {
  const baseClassName = `${className} ${href ? `${className}--link link-underline-target` : `${className}--pending`}`.trim();

  if (href) {
    return (
      <a className={baseClassName} data-profile={profile} href={href} rel="noopener noreferrer" target="_blank">
        <span className="link-underline-target__text">{label}</span>
      </a>
    );
  }

  return (
    <span
      aria-disabled="true"
      aria-label={`${label} - ${pendingLabel}`}
      className={baseClassName}
      data-profile={profile}
      data-state="pending"
      title={pendingLabel}
    >
      {label}
    </span>
  );
}
