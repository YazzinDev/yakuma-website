import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setDocumentLanguage } from '../i18n/config';
import { placeholderAssets } from '../assets/pencil-placeholders';
import PageMeta from '../components/atoms/PageMeta';
import SectionKicker from '../components/atoms/SectionKicker';
import PageShell from '../layouts/PageShell';

export default function HoshiNewsPage({ language, slug }) {
  const normalizedLanguage = setDocumentLanguage(language);
  const { t } = useTranslation(['hoshi', 'common']);
  const news = t('hoshi:news', { returnObjects: true });
  const article = news.items.find((item) => item.slug === slug) ?? news.items[0];
  const routePath = `/${normalizedLanguage}/games/hoshi/news/${article.slug}`;

  return (
    <>
      <PageMeta
        description={article.metaDescription ?? article.body}
        image={placeholderAssets.hoshiBoard}
        imageAlt={t('hoshi:images.board')}
        language={normalizedLanguage}
        path={routePath}
        title={`${article.title} | Hoshi: Star Sudoku`}
      />
      <PageShell
        footerScope="hoshi"
        headerVariant="hoshi"
        language={normalizedLanguage}
        mainClassName="page page--hoshi"
      >
        <article className="hoshi-news-article">
          <div className="hoshi-news-article__header">
            <SectionKicker>{news.eyebrow}</SectionKicker>
            <span>{article.date}</span>
            <h1>{article.title}</h1>
            <p>{article.body}</p>
          </div>
          <img alt={t('hoshi:images.board')} src={placeholderAssets.hoshiBoard} />
          <div className="hoshi-news-article__body">
            {article.content.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <Link className="button button--hoshi" to={`/${normalizedLanguage}/games/hoshi#news`}>
              {news.backLabel}
            </Link>
          </div>
        </article>
      </PageShell>
    </>
  );
}
