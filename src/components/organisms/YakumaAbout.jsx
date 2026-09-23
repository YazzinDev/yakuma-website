import { useTranslation } from 'react-i18next';
import software from '../../assets/design/software-systems.svg';
import games from '../../assets/design/game-upgrade.svg';
import products from '../../assets/design/product-design.svg';
import GarmentLabel from '../molecules/GarmentLabel';
import SectionClosing from '../molecules/SectionClosing';
import CapabilityCarousel from './CapabilityCarousel';
import '../../styles/yakuma-about.css';

const descriptions = {
  en: [
    'We build software that makes the day\na little easier and keeps working\nas your needs grow.',
    'That “one more try” feeling?\nWe build for it, with satisfying\ncontrols and room to explore.',
    'We turn the idea in your head into\nsomething people can pick up,\nunderstand and enjoy using.',
  ],
  de: [
    'Wir bauen Software, die den Alltag leichter macht und mit deinen Anforderungen wächst.',
    'Dieses „Noch ein Versuch“-Gefühl? Dafür entwickeln wir Spiele, mit guter Steuerung und Raum zum Entdecken.',
    'Wir machen aus deiner Idee ein Produkt, das Menschen verstehen und gerne benutzen.',
  ],
};
const capabilities = [
  { id: 'software', filename: 'SOFTWARE_ENGINEERING.JAR', title: 'SOFTWARE\nENGINEERING', icon: software },
  { id: 'games', filename: 'GAME_DEVELOPMENT.CPP', title: 'GAME\nDEVELOPMENT', icon: games },
  { id: 'products', filename: 'DIGITAL_PRODUCT_DESIGN.PEN', title: 'DIGITAL PRODUCT\nDESIGN', icon: products },
];

export default function YakumaAbout({ language }) {
  const { t } = useTranslation('common');
  const copy = descriptions[language] ?? descriptions.en;
  return <section className="yakuma-about" id="about" aria-labelledby="about-title">
    <div className="yakuma-about__intro">
      <h2 id="about-title">{language === 'de' ? 'WIR BAUEN.' : 'WE BUILD.'}<span>SOFTWARE &amp; GAMES.</span></h2>
      <p>{language === 'de'
        ? 'Yakuma verbindet Software Engineering, Spieleentwicklung und Produktdesign. '
        : 'Yakuma brings software engineering, game development and product design together. '}{t('brand.slogan')}</p>
    </div>
    <GarmentLabel />
    <CapabilityCarousel items={capabilities.map((item, index) => ({ ...item, description: copy[index] }))} language={language} />
    <SectionClosing>THOUGHT THROUGH. BUILT WITH INTENT.</SectionClosing>
  </section>;
}
