import SectionKicker from '../atoms/SectionKicker';
import FaqItem from '../molecules/FaqItem';

export default function FaqSection({ description, eyebrow, items, title, variant = 'yakuma' }) {
  return (
    <section className={`faq-section faq-section--${variant}`} id="faq">
      <div className="faq-section__intro">
        <SectionKicker>{eyebrow}</SectionKicker>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="faq-section__list">
        {items.map((item) => (
          <FaqItem answer={item.answer} key={item.question} question={item.question} />
        ))}
      </div>
    </section>
  );
}
