import ActionLink from '../atoms/ActionLink';

/** EGIxi: the pair has a single set of outer corners, not two nested frames. */
export default function HeroActions({ language }) {
  return <div className="hero-actions">
    <i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" />
    <ActionLink enclosed={false} to={`/${language}#projects`}>{language === 'de' ? 'PROJEKTE ANSEHEN' : 'VIEW PROJECTS'}</ActionLink>
    <ActionLink enclosed={false} tone="secondary" to={`/${language}#contact`}>{language === 'de' ? 'KONTAKT' : 'GET IN TOUCH'}</ActionLink>
  </div>;
}
