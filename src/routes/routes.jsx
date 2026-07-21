import App from '../App';
import HoshiPage from '../pages/HoshiPage';
import HoshiDownloadPage from '../pages/HoshiDownloadPage';
import HoshiDeleteAccountPage from '../pages/HoshiDeleteAccountPage';
import HoshiNewsPage from '../pages/HoshiNewsPage';
import LandingPage from '../pages/LandingPage';
import LegalPage from '../pages/LegalPage';
import NotFoundPage from '../pages/NotFoundPage';
import RedirectToLocale from '../pages/RedirectToLocale';
import RedirectUnsupportedLanguage from '../pages/RedirectUnsupportedLanguage';
import ServicePage from '../pages/ServicePage';
import { legalDocuments, neutralRouteAliases, serviceIds, supportedLanguages } from './localizedPaths';
import { Navigate } from 'react-router-dom';

const localizedRoutes = supportedLanguages.flatMap((language) => [
  {
    path: language,
    element: <LandingPage language={language} />,
  },
  ...serviceIds.map((serviceId) => ({
    path: `${language}/services/${serviceId}`,
    element: <ServicePage language={language} serviceId={serviceId} />,
  })),
  {
    path: `${language}/games/hoshi`,
    element: <HoshiPage language={language} />,
  },
  {
    path: `${language}/games/hoshi/download`,
    element: <HoshiDownloadPage language={language} />,
  },
  {
    path: `${language}/games/hoshi/delete-account`,
    element: <HoshiDeleteAccountPage language={language} />,
  },
  {
    path: `${language}/games/hoshi/news/the-first-boards`,
    element: <HoshiNewsPage language={language} slug="the-first-boards" />,
  },
  {
    path: `${language}/404`,
    element: <NotFoundPage language={language} />,
  },
  ...legalDocuments.yakuma.map((docType) => ({
    path: `${language}/legal/${docType}`,
    element: <LegalPage docType={docType} language={language} scope="yakuma" />,
  })),
  ...legalDocuments.hoshi.map((docType) => ({
    path: `${language}/games/hoshi/legal/${docType}`,
    element: <LegalPage docType={docType} language={language} scope="hoshi" />,
  })),
  {
    path: `${language}/*`,
    element: <Navigate replace to={`/${language}/404`} />,
  },
]);

export const routes = [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <RedirectToLocale /> },
      ...neutralRouteAliases.map(({ path, target }) => ({
        path: path.slice(1),
        element: <RedirectToLocale target={target} />,
      })),
      ...localizedRoutes,
      { path: ':unsupportedLanguage/*', element: <RedirectUnsupportedLanguage /> },
      { path: '*', element: <RedirectUnsupportedLanguage /> },
    ],
  },
];
