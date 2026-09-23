import { ViteReactSSG } from 'vite-react-ssg';
import './i18n/config';
import './styles/fonts.css';
import './styles/main.css';
import './styles/design-system.css';
import './styles/yakuma-hero.css';
import './styles/navigation.css';
import { routes } from './routes/routes.jsx';

export const createRoot = ViteReactSSG({ routes });
