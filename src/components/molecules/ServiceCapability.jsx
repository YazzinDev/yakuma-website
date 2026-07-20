import PlaceholderImage from '../atoms/PlaceholderImage';

export default function ServiceCapability({ capability, image, index }) {
  return (
    <article className="service-capability">
      <PlaceholderImage alt={capability.title} className="service-capability__image" src={image} />
      <div className="service-capability__body">
        <span>{String(index + 1).padStart(2, '0')}</span>
        <h3>{capability.title}</h3>
        <p>{capability.text}</p>
      </div>
    </article>
  );
}
