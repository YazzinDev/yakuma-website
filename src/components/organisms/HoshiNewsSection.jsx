import { Link } from 'react-router-dom';
import SectionKicker from '../atoms/SectionKicker';

function NewsPlaceholderVisual({ image, imageAlt }) {
  return (
    <span className="news-card__visual">
      <img alt={imageAlt} src={image} />
    </span>
  );
}

export default function HoshiNewsSection({ image, imageAlt, news }) {
  const newsItems = Array.isArray(news.items) && news.items.length > 0 ? news.items : [news.featured].filter(Boolean);
  const activeNews = newsItems[0];

  return (
    <section className="news-section" id="news">
      <div className="news-section__intro">
        <div>
          <SectionKicker>{news.eyebrow}</SectionKicker>
          <h2>{news.title}</h2>
        </div>
        <p className="news-section__description">{news.description}</p>
      </div>
      <div aria-live="polite" className="news-section__cards">
        <div className="news-section__feature">
          <Link
            className="news-card news-card--featured news-card--linkable"
            to={activeNews.href ?? '#news'}
          >
            <NewsPlaceholderVisual image={image} imageAlt={imageAlt} />
            <div className="news-card__body">
              <span className="news-card__date">{activeNews.date}</span>
              <h3>{activeNews.title}</h3>
              <p>{activeNews.body}</p>
              <span className="news-card__link">
                <span className="news-card__link-text">{news.readLabel}</span>
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
