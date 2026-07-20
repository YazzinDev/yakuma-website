import { Link } from 'react-router-dom';
import { localizedHref } from '../../routes/localizedPaths';

export default function HeaderNav({ ariaLabel, className = '', items, language, onNavigate }) {
  return (
    <nav className={`header-nav ${className}`.trim()} aria-label={ariaLabel}>
      {items.map((item) => {
        const href = localizedHref(language, item.href);
        return (
          <Link className="link-underline-target" key={item.label} onClick={onNavigate} to={href}>
            <span className="link-underline-target__text">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
