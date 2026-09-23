import listening from '../../assets/design/faq-listening.svg';
import FaqSignal from './FaqSignal';

export default function AnswerIndexLabel({ count }) {
  return <aside className="answer-index" aria-hidden="true" data-pencil-node="sDFZu">
    <div className="answer-index__edition"><span>YK / ANSWER INDEX</span><span>{String(count).padStart(2, '0')}</span></div>
    <div className="answer-index__brand"><strong>Q / A</strong><img src={listening} alt="" /></div>
    <div className="answer-index__contents">01 / STUDIO<br />02 / PROJECTS<br />03 / FOUNDER<br />04 / SERVICES<br />05 / CONTACT</div>
    <p>ASK A QUESTION.<br />START A CONVERSATION.</p>
    <FaqSignal response />
  </aside>;
}
