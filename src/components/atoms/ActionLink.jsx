import { Link } from 'react-router-dom';
import ActionContent from './ActionContent';
import '../../styles/action-link.css';

/** POQTa / M880sB: chamfered action with optional outer L-corner enclosure. */
export default function ActionLink({ to, children, tone = 'primary', enclosed = true, className = '' }) {
  return <Link to={to} className={`action-link action-link--${tone} ${enclosed ? 'action-link--enclosed' : ''} ${className}`.trim()}>
    <ActionContent tone={tone} enclosed={enclosed}>{children}</ActionContent>
  </Link>;
}
