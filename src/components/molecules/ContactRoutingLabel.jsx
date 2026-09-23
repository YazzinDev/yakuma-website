import Micrographic from '../atoms/Micrographic';
import ideas from '../../assets/design/connected-ideas.svg';
import outgoing from '../../assets/design/outgoing-message.svg';

export default function ContactRoutingLabel() {
  return <div className="contact-routing" aria-hidden="true" data-pencil-node="prbi0 / YG5se">
    <span className="contact-routing__title"><span>YK / DIRECT </span>CONTACT</span>
    <img className="contact-routing__ideas" src={ideas} alt="" />
    <img className="contact-routing__outgoing" src={outgoing} alt="" />
    <span className="contact-routing__index">05</span>
    <div className="contact-routing__channel"><Micrographic /><span>IDEAS / INQUIRIES</span></div>
  </div>;
}
