import SectionKicker from '../atoms/SectionKicker';
import PlaceholderImage from '../atoms/PlaceholderImage';

export default function ServiceHero({ backgroundWord, image, imageAlt, intro, kicker, title }) {
  return (
    <section className="service-hero section-frame section-frame--split">
      <div className="service-hero__copy">
        <SectionKicker>{kicker}</SectionKicker>
        <h1>{title}</h1>
        <p>{intro}</p>
        <span aria-hidden="true">{backgroundWord}</span>
      </div>
      <PlaceholderImage
        alt={imageAlt}
        className="service-hero__visual"
        fetchPriority="high"
        loading="eager"
        src={image}
      />
    </section>
  );
}
