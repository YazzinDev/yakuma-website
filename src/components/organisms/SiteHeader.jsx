import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../atoms/LanguageSwitcher';
import MenuToggleButton from '../atoms/MenuToggleButton';
import HeaderNav from '../molecules/HeaderNav';
import Wordmark from '../atoms/Wordmark';
import StoreBadge from '../molecules/StoreBadge';
import { hoshiStoreLinks } from '../../config/storeLinks';
import useActiveSection from '../../hooks/useActiveSection';

const HEADER_BEHAVIORS = {
  heroReveal: 'hero-reveal',
  solid: 'solid',
};

function normalizeHeaderBehavior(behavior, variant) {
  if (behavior) {
    return behavior;
  }

  return variant === 'transparent' ? HEADER_BEHAVIORS.heroReveal : HEADER_BEHAVIORS.solid;
}

export default function SiteHeader({ behavior, elevated = false, language, variant = 'yakuma' }) {
  const { t } = useTranslation(['common', 'hoshi']);
  const [menuPath, setMenuPath] = useState(null);
  const headerRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const isHoshi = variant === 'hoshi';
  const { pathname } = useLocation();
  const isMenuOpen = menuPath === pathname;
  const observedSectionId = useActiveSection(pathname);
  const sectionPage = isHoshi ? `/${language}/games/hoshi` : `/${language}`;
  const activeSectionId = pathname.replace(/\/$/, '') === sectionPage ? observedSectionId : '';
  const normalizedBehavior = normalizeHeaderBehavior(behavior, variant);
  const navItems = isHoshi
      ? [
        { label: t('hoshi:nav.about'), href: '/games/hoshi#about' },
        { label: t('hoshi:nav.gameplay'), href: '/games/hoshi#gameplay' },
        { label: t('hoshi:nav.faq'), href: '/games/hoshi#faq' },
      ]
    : [
        { label: t('nav.about'), href: '/#about' },
        { label: t('nav.projects'), href: '/#projects' },
        { label: t('nav.faq'), href: '/#faq' },
        { label: t('cta.getInTouch'), href: '/#contact' },
      ];
  const hoshiBadges = isHoshi ? t('hoshi:hero.badges', { returnObjects: true }) : null;
  const storeBadges = isHoshi ? (
    <div className="site-header__store-badges">
      <StoreBadge href={hoshiStoreLinks.appStore} label={hoshiBadges.appStore} pendingLabel={hoshiBadges.pending} small={hoshiBadges.appStoreSmall} store="app-store" />
      <StoreBadge href={hoshiStoreLinks.googlePlay} label={hoshiBadges.googlePlay} pendingLabel={hoshiBadges.pending} small={hoshiBadges.googlePlaySmall} store="google-play" />
    </div>
  ) : null;
  const closeMenu = () => setMenuPath(null);
  const headerClasses = [
    'site-header',
    `site-header--${variant}`,
    `site-header--behavior-${normalizedBehavior}`,
    elevated ? 'site-header--elevated' : '',
    isMenuOpen ? 'site-header--menu-open' : '',
    isScrolled ? 'site-header--scrolled' : 'site-header--at-top',
  ]
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const header = headerRef.current;
    const trigger = header.querySelector('.menu-toggle');
    const previousOverflow = document.body.style.overflow;
    const background = [...document.querySelectorAll('main, .site-footer')];
    const previousInert = background.map(element => element.inert);
    background.forEach(element => { element.inert = true; });
    document.body.style.overflow = 'hidden';
    header.querySelector('.header-nav--mobile a')?.focus();
    const handleKey = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuPath(null);
      }
      if (event.key !== 'Tab') return;
      const focusable = [...header.querySelectorAll('a[href], button:not([disabled])')]
        .filter(element => element.getClientRects().length);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
      }
    };
    const desktop = window.matchMedia('(min-width: 1101px)');
    const closeOnDesktop = () => { if (desktop.matches) setMenuPath(null); };
    desktop.addEventListener('change', closeOnDesktop);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      background.forEach((element, index) => { element.inert = previousInert[index]; });
      desktop.removeEventListener('change', closeOnDesktop);
      document.removeEventListener('keydown', handleKey);
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const updateScrollState = () => setIsScrolled(window.scrollY > 8);

    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });

    return () => window.removeEventListener('scroll', updateScrollState);
  }, []);

  return (
    <header className={headerClasses} ref={headerRef}>
      <Link className="site-header__brand link-underline-target" onClick={closeMenu} to={`/${language}`}>
        <Wordmark className="link-underline-target__text" />
      </Link>
      <HeaderNav
        ariaLabel={t('nav.ariaLabel')}
        className="header-nav--desktop"
        items={navItems}
        activeSectionId={activeSectionId}
        language={language}
      />
      <div className="site-header__actions">
        <MenuToggleButton
          expanded={isMenuOpen}
          labelClose={t('nav.closeMenu')}
          labelOpen={t('nav.openMenu')}
          onClick={() => setMenuPath(current => current === pathname ? null : pathname)}
        />
        {storeBadges}
        <LanguageSwitcher language={language} />
      </div>
      <div className="site-header__mobile-menu" hidden={!isMenuOpen} id="site-mobile-navigation">
        <HeaderNav
          ariaLabel={t('nav.mobileAriaLabel')}
          className="header-nav--mobile"
          items={navItems}
          activeSectionId={activeSectionId}
          language={language}
          onNavigate={closeMenu}
        />
        <div className="site-header__mobile-actions">
          <div className="site-header__mobile-language">
            {!isHoshi && <span className="site-header__mobile-language-label">{t('language.label')}:</span>}
            <LanguageSwitcher language={language} />
          </div>
          {isHoshi && storeBadges}
        </div>
      </div>
    </header>
  );
}
