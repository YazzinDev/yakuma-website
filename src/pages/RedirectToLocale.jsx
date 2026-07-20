import { Head } from 'vite-react-ssg';
import { Navigate } from 'react-router-dom';
import { siteUrl } from '../config/site';
import { defaultLanguage } from '../i18n/languages';

export default function RedirectToLocale({ target = `/${defaultLanguage}` }) {
  const redirectTarget = target.startsWith('/') ? target : `/${target}`;
  const preserveUrlSuffixScript = `window.location.replace(${JSON.stringify(redirectTarget)} + window.location.search + window.location.hash);`;

  return (
    <>
      <Head>
        <title>Yakuma</title>
        <meta
          name="description"
          content="Yakuma is a modern product studio for software, games, and interactive digital systems."
        />
        <html lang="en" />
        <meta httpEquiv="refresh" content={`0;url=${redirectTarget}`} />
        <script>{preserveUrlSuffixScript}</script>
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={`${siteUrl}${redirectTarget}`} />
      </Head>
      <p>
        Continue to <a href={redirectTarget}>{redirectTarget}</a>.
      </p>
      <Navigate replace to={redirectTarget} />
    </>
  );
}
