import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../atoms/Button';
import LanguageSwitcher from '../atoms/LanguageSwitcher';
import MenuToggleButton from '../atoms/MenuToggleButton';
import HeaderNav from '../molecules/HeaderNav';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isHoshi = variant === 'hoshi';
  const normalizedBehavior = normalizeHeaderBehavior(behavior, variant);
  const navItems = isHoshi
      ? [
        { label: t('hoshi:nav.about'), href: '/games/hoshi#about' },
        { label: t('hoshi:nav.gameplay'), href: '/games/hoshi#gameplay' },
        { label: t('hoshi:nav.news'), href: '/games/hoshi#news' },
        { label: t('hoshi:nav.faq'), href: '/games/hoshi#faq' },
      ]
    : [
        { label: t('nav.about'), href: '/#about' },
        { label: t('nav.work'), href: '/#work' },
        { label: t('nav.projects'), href: '/#projects' },
        { label: t('nav.faq'), href: '/#faq' },
      ];
  const ctaHref = isHoshi ? `/${language}/games/hoshi#download` : `/${language}#contact`;
  const ctaLabel = isHoshi ? t('cta.playFree') : t('cta.getInTouch');
  const closeMenu = () => setIsMenuOpen(false);
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
    const updateScrollState = () => setIsScrolled(window.scrollY > 8);

    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });

    return () => window.removeEventListener('scroll', updateScrollState);
  }, []);

  return (
    <header className={headerClasses}>
      <Link className="site-header__brand link-underline-target" onClick={closeMenu} to={`/${language}`}>
        <span className="link-underline-target__text">{t('brand')}</span>
      </Link>
      <HeaderNav
        ariaLabel={t('nav.ariaLabel')}
        className="header-nav--desktop"
        items={navItems}
        language={language}
      />
      <div className="site-header__actions">
        <MenuToggleButton
          expanded={isMenuOpen}
          labelClose={t('nav.closeMenu')}
          labelOpen={t('nav.openMenu')}
          onClick={() => setIsMenuOpen((current) => !current)}
        />
        <Button href={ctaHref} variant={isHoshi ? 'hoshi' : 'contrast'}>
          {ctaLabel}
        </Button>
        <LanguageSwitcher language={language} />
      </div>
      <div className="site-header__mobile-menu" hidden={!isMenuOpen} id="site-mobile-navigation">
        <HeaderNav
          ariaLabel={t('nav.mobileAriaLabel')}
          className="header-nav--mobile"
          items={navItems}
          language={language}
          onNavigate={closeMenu}
        />
        <div className="site-header__mobile-actions">
          <div className="site-header__mobile-contact">
            <Button href={ctaHref} onClick={closeMenu} variant={isHoshi ? 'hoshi' : 'contrast'}>
              {ctaLabel}
            </Button>
          </div>
          <div className="site-header__mobile-language">
            <span className="site-header__mobile-language-label">{t('language.label')}:</span>
            <LanguageSwitcher language={language} />
          </div>
        </div>
      </div>
    </header>
  );
}
