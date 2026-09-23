import SectionKicker from '../atoms/SectionKicker';
import FaqItem from '../molecules/FaqItem';

export default function FaqSection({ description, eyebrow, items, title, variant = 'yakuma' }) {
  return (
    <section className={`faq-section faq-section--${variant}`} id="faq">
      <div className="faq-section__intro">
        {eyebrow ? <SectionKicker>{eyebrow}</SectionKicker> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="faq-section__list">
        {items.map((item, index) => (
          <FaqItem answer={item.answer} initiallyOpenOnMobile={variant === 'hoshi' && index === 0} key={item.question} question={item.question} />
        ))}
      </div>
    </section>
  );
}
