import { ViteReactSSG } from 'vite-react-ssg';
import './i18n/config';
import './styles/main.css';
import { routes } from './routes/routes.jsx';

export const createRoot = ViteReactSSG({ routes });
