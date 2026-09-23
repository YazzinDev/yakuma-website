/** Shared typography for both themes; color inherits from the surrounding theme. */
export default function Wordmark({ placement = 'header', className = '' }) {
  return <span className={`wordmark wordmark--${placement} ${className}`.trim()}>YAKUMA</span>;
}
