import SectionKicker from '../atoms/SectionKicker';
import ServiceCapability from '../molecules/ServiceCapability';

export default function ServiceDetailSection({ capabilities, heading, images, kicker }) {
  return (
    <section className="service-detail section-frame">
      <div className="service-detail__header">
        <SectionKicker>{kicker}</SectionKicker>
        <h2>{heading}</h2>
      </div>
      <div className="service-detail__grid">
        {capabilities.map((capability, index) => (
          <ServiceCapability
            capability={capability}
            image={images[index]}
            index={index}
            key={capability.title}
          />
        ))}
      </div>
    </section>
  );
}
