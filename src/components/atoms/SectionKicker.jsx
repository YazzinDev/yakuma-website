export default function SectionKicker({ children, className = '' }) {
  return <p className={`section-kicker ${className}`.trim()}>{children}</p>;
}
