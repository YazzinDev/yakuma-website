import { Link } from 'react-router-dom';
import { localizedHref } from '../../routes/localizedPaths';

export default function HeaderNav({ ariaLabel, className = '', items, language, onNavigate, activeSectionId = '' }) {
  return (
    <nav className={`header-nav ${className}`.trim()} aria-label={ariaLabel}>
      {items.map((item) => {
        const href = localizedHref(language, item.href);
        return (
          <Link aria-current={item.href.split('#')[1] === activeSectionId ? 'location' : undefined}
            className="link-underline-target" key={item.label} onClick={onNavigate} to={href}>
            <span className="link-underline-target__text">{item.label}</span>
            <span className="header-nav__brackets" aria-hidden="true"><i /><i /><i /><i /></span>
          </Link>
        );
      })}
    </nav>
  );
}
