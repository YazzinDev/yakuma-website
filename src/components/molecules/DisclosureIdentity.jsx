import stripe from '../../assets/design/textile-stripe.svg';
import Micrographic from '../atoms/Micrographic';

// The mobile file and registration brackets follow Pencil molecule ZodlH.
export default function DisclosureIdentity({ language }) {
  return <div className="disclosure-identity" aria-hidden="true">
    <div className="disclosure-identity__desktop"><span>YK / DOCUMENT</span><span>01</span></div>
    <svg className="disclosure-identity__brackets" viewBox="0 0 280 116" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M0 24V0h24m232 0h24v24m0 68v24h-24M24 116H0V92" />
    </svg>
    <svg className="disclosure-identity__file" viewBox="0 0 18 20" fill="none" stroke="currentColor" strokeWidth=".75">
      <path d="M2 1h9l5 5v13H2z M11 1v5h5M5 10h7m-7 4h5" />
    </svg>
    <span className="disclosure-identity__name"><span className="disclosure-identity__name-desktop">LEGAL / {language.toUpperCase()}</span><span className="disclosure-identity__name-mobile">DOC<br />01-{language.toUpperCase()}</span></span>
    <Micrographic className="disclosure-identity__frequency" name="frequency" preserveAspectRatio="none" />
    <img className="disclosure-identity__stripe" src={stripe} alt="" />
  </div>;
}
