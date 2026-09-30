import { Navigate, useLocation } from 'react-router-dom';
import { getErrorRoute } from '../routes/errorRoutes';

export default function RedirectToNotFound() {
  return <Navigate replace to={getErrorRoute(useLocation().pathname)} />;
}
