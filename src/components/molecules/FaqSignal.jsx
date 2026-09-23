import Micrographic from '../atoms/Micrographic';
import arrows from '../../assets/design/frequency-arrows.svg';

export default function FaqSignal({ response = false }) {
  if (response) return <div className="faq-response" aria-hidden="true" data-pencil-node="DOiwv">
    <img src={arrows} alt="" />
    <svg viewBox="0 0 120 52"><path d="M14 0h-14v52h14m92-52h14v52h-14m-76-26h60m-48-12l-12 12 12 12m36-24l12 12-12 12" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
  </div>;
  return <div className="faq-signal" aria-hidden="true" data-pencil-node="Jmfau / JvMbb">
    <Micrographic />
    <svg className="faq-signal__route" viewBox="0 0 400 40"><path d="M0 12h104l20 20h150l20-20h88m-10-10l10 10-10 10m-372-18v16m34-16v16m34-16v16m66 4v16m16-16v16m16-16v16m16-16v16m16-16v16m16-16v16m16-16v16m16-16v16m16-16v16" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
    <span className="faq-signal__desktop">QUESTION IN / ANSWER OUT</span>
    <span className="faq-signal__mobile">Q / A</span>
  </div>;
}
