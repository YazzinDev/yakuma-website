import SectionKicker from '../atoms/SectionKicker';
import StoreBadge from '../molecules/StoreBadge';

export default function HoshiDownloadSection({ badges, cta, image, imageAlt, storeLinks }) {
  return (
    <section className="download-section" id="download">
      <div>
        <SectionKicker>{cta.eyebrow}</SectionKicker>
        <h2>{cta.title}</h2>
        <p>{cta.body}</p>
        <div className="store-badge-row">
          <StoreBadge
            href={storeLinks.appStore}
            label={badges.appStore}
            pendingLabel={badges.pending}
            small={badges.appStoreSmall}
            store="app-store"
          />
          <StoreBadge
            href={storeLinks.googlePlay}
            label={badges.googlePlay}
            pendingLabel={badges.pending}
            small={badges.googlePlaySmall}
            store="google-play"
          />
        </div>
      </div>
      <div className="tablet-stage">
        <img alt={imageAlt} src={image} />
      </div>
    </section>
  );
}
