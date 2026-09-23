import App from '../App';
import RedirectToLocale from '../pages/RedirectToLocale';
import RedirectUnsupportedLanguage from '../pages/RedirectUnsupportedLanguage';
import { legalDocuments, neutralRouteAliases, supportedLanguages } from './localizedPaths';
import { Navigate } from 'react-router-dom';

const localizedRoutes = supportedLanguages.flatMap((language) => [
  {
    path: language,
    lazy: async () => {
      const { default: LandingPage } = await import('../pages/LandingPage');
      return { Component: () => <LandingPage language={language} /> };
    },
  },
  {
    path: `${language}/games/hoshi`,
    lazy: async () => {
      const { default: HoshiPage } = await import('../pages/HoshiPage');
      return { Component: () => <HoshiPage language={language} /> };
    },
  },
  {
    path: `${language}/games/hoshi/download`,
    lazy: async () => {
      const { default: HoshiDownloadPage } = await import('../pages/HoshiDownloadPage');
      return { Component: () => <HoshiDownloadPage language={language} /> };
    },
  },
  {
    path: `${language}/games/hoshi/delete-account`,
    lazy: async () => {
      const { default: HoshiDeleteAccountPage } = await import('../pages/HoshiDeleteAccountPage');
      return { Component: () => <HoshiDeleteAccountPage language={language} /> };
    },
  },
  {
    path: `${language}/games/hoshi/news/the-first-boards`,
    lazy: async () => {
      const { default: HoshiNewsPage } = await import('../pages/HoshiNewsPage');
      return { Component: () => <HoshiNewsPage language={language} slug="the-first-boards" /> };
    },
  },
  {
    path: `${language}/404`,
    lazy: async () => {
      const { default: NotFoundPage } = await import('../pages/NotFoundPage');
      return { Component: () => <NotFoundPage language={language} /> };
    },
  },
  ...legalDocuments.yakuma.map((docType) => ({
    path: `${language}/legal/${docType}`,
    lazy: async () => {
      const { default: LegalPage } = await import('../pages/LegalPage');
      return { Component: () => <LegalPage docType={docType} language={language} scope="yakuma" /> };
    },
  })),
  ...legalDocuments.hoshi.map((docType) => ({
    path: `${language}/games/hoshi/legal/${docType}`,
    lazy: async () => {
      const { default: LegalPage } = await import('../pages/LegalPage');
      return { Component: () => <LegalPage docType={docType} language={language} scope="hoshi" /> };
    },
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
