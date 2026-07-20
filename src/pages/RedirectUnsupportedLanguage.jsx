import { Navigate } from 'react-router-dom';
import { defaultLanguage } from '../i18n/languages';

export default function RedirectUnsupportedLanguage() {
  return <Navigate replace to={`/${defaultLanguage}`} />;
}
