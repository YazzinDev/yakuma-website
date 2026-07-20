import { Link } from 'react-router-dom';

export default function Button({ children, href, variant = 'primary', className = '', ...props }) {
  const classes = `button button--${variant} link-underline-target ${className}`.trim();
  const content = <span className="button__label link-underline-target__text">{children}</span>;

  if (href) {
    const isHttp = /^https?:\/\//.test(href);
    const isExternal = isHttp || href.startsWith('mailto:');
    if (isExternal) {
      const externalProps = isHttp ? { rel: 'noopener noreferrer', target: '_blank' } : {};
      return (
        <a className={classes} href={href} {...externalProps} {...props}>
          {content}
        </a>
      );
    }
    return (
      <Link className={classes} to={href} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} type="button" {...props}>
      {content}
    </button>
  );
}
