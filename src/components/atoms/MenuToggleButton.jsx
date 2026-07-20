export default function MenuToggleButton({ expanded, labelClose, labelOpen, onClick }) {
  return (
    <button
      aria-controls="site-mobile-navigation"
      aria-expanded={expanded}
      aria-label={expanded ? labelClose : labelOpen}
      className="menu-toggle"
      onClick={onClick}
      type="button"
    >
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span aria-hidden="true" />
    </button>
  );
}
