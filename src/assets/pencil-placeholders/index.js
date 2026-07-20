import yakumaHero from './yakuma-hero-placeholder.png';
import yakumaAbout from './yakuma-about-placeholder.png';
import yakumaServices from './yakuma-services-placeholder.png';
import serviceSoftwareHero from './service-software-hero-placeholder.png';
import serviceSoftwareArchitecture from './service-software-architecture-placeholder.png';
import serviceSoftwareImplementation from './service-software-implementation-placeholder.png';
import serviceSoftwareIteration from './service-software-iteration-placeholder.png';
import serviceGameHero from './service-game-hero-placeholder.png';
import serviceGameConcept from './service-game-concept-placeholder.png';
import serviceGamePrototype from './service-game-prototype-placeholder.png';
import serviceGamePolish from './service-game-polish-placeholder.png';
import serviceInteractiveHero from './service-interactive-hero-placeholder.png';
import serviceInteractiveFlows from './service-interactive-flows-placeholder.png';
import serviceInteractiveInterfaces from './service-interactive-interfaces-placeholder.png';
import serviceInteractiveHandoff from './service-interactive-handoff-placeholder.png';
import hoshiHeroBackground from './hoshi-hero-background-placeholder.png';
import hoshiFinalDevice from './hoshi-final-device-placeholder.png';
import hoshiStar from './hoshi-star-placeholder.png';
import hoshiBoard from './hoshi-board-placeholder.png';

export const placeholderAssets = {
  yakumaHero,
  yakumaAbout,
  yakumaServices,
  hoshiHeroBackground,
  hoshiFinalDevice,
  hoshiStar,
  hoshiBoard,
  serviceHeroes: {
    'software-engineering': serviceSoftwareHero,
    'game-design': serviceGameHero,
    'interactive-product-design': serviceInteractiveHero,
  },
  services: {
    'software-engineering': [
      serviceSoftwareArchitecture,
      serviceSoftwareImplementation,
      serviceSoftwareIteration,
    ],
    'game-design': [
      serviceGameConcept,
      serviceGamePrototype,
      serviceGamePolish,
    ],
    'interactive-product-design': [
      serviceInteractiveFlows,
      serviceInteractiveInterfaces,
      serviceInteractiveHandoff,
    ],
  },
};
