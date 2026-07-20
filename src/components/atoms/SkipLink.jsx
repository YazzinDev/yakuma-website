export default function SkipLink({ children, href = '#main-content' }) {
  return (
    <a className="skip-link" href={href}>
      {children}
    </a>
  );
}
