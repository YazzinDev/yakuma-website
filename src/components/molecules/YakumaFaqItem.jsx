import { useId } from 'react';
import FaqToggle from '../atoms/FaqToggle';

export default function YakumaFaqItem({ question, answer, index, open, onToggle }) {
  const id = useId();
  return <div className="yakuma-faq-item" data-open={open} data-pencil-node="PCXK2 / vTUh3">
    <h3><button type="button" id={`${id}-question`} aria-expanded={open} aria-controls={`${id}-answer`} onClick={onToggle}>
      <span className="yakuma-faq-item__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <span>{question}</span><FaqToggle open={open} />
    </button></h3>
    <div id={`${id}-answer`} role="region" aria-labelledby={`${id}-question`} hidden={!open} className="yakuma-faq-item__answer"><p>{answer}</p></div>
  </div>;
}
