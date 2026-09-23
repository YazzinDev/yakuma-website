import ActionContent from './ActionContent';
import '../../styles/action-link.css';

export default function ActionButton({ children, type = 'button', disabled = false, className = '' }) {
  return <button type={type} disabled={disabled} className={`action-link action-link--primary action-link--enclosed ${className}`.trim()}>
    <ActionContent>{children}</ActionContent>
  </button>;
}
