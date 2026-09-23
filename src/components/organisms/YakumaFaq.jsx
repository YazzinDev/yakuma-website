import { useState } from 'react';
import YakumaFaqItem from '../molecules/YakumaFaqItem';
import AnswerIndexLabel from '../molecules/AnswerIndexLabel';
import FaqSignal from '../molecules/FaqSignal';
import SectionClosing from '../molecules/SectionClosing';
import '../../styles/yakuma-faq.css';

export default function YakumaFaq({ language, items, description }) {
  const [expanded, setExpanded] = useState([0]);
  const de = language === 'de';
  const toggle = index => setExpanded(current => current.includes(index) ? current.filter(item => item !== index) : [...current, index]);
  return <section className="yakuma-faq" id="faq" aria-labelledby="faq-title">
    <h2 id="faq-title">{de ? <>HÄUFIGE<span> FRAGEN.</span></> : <>COMMON<span> QUESTIONS.</span></>}</h2>
    <p className="yakuma-faq__intro">{description}</p>
    <FaqSignal />
    <div className="yakuma-faq__content">
      <div className="yakuma-faq__list">
        <div className="yakuma-faq__mobile-index"><span>Q / A</span><span aria-label={de ? `${expanded.length} von ${items.length} Antworten geöffnet` : `${expanded.length} of ${items.length} answers open`}>{String(expanded.length).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span></div>
        {items.map((item, index) => <YakumaFaqItem key={index} {...item} index={index} open={expanded.includes(index)} onToggle={() => toggle(index)} />)}
      </div>
      <AnswerIndexLabel count={items.length} />
    </div>
    <SectionClosing symbol={null}><span>YAKUMA / QUESTIONS &amp; ANSWERS</span><span className="yakuma-faq__closing-count">{String(items.length).padStart(2, '0')} QUESTIONS / ONE STUDIO</span></SectionClosing>
  </section>;
}
