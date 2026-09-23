/** Semantic element, visual role and alignment remain independent. */
export default function HoshiText({ as: Element = 'p', variant = 'body', align = 'left', className = '', children, ...props }) {
  return <Element {...props} className={`hoshi-text hoshi-text--${variant} text-align--${align} ${className}`.trim()}>{children}</Element>;
}
