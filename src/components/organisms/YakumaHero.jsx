import Micrographic from '../atoms/Micrographic';
import HeroGlobe from '../molecules/HeroGlobe';
import HeroActions from '../molecules/HeroActions';
import HeroTelemetry from '../molecules/HeroTelemetry';

export default function YakumaHero({ language }) {
  return <section className="yakuma-hero" id="hero" aria-labelledby="yakuma-title">
    <p className="yakuma-hero__annotation">ENGINEERED WITH INTENT / BUILT FOR PEOPLE</p>
    <div className="yakuma-hero__globe" aria-hidden="true">
      <HeroGlobe />
      <span className="yakuma-hero__label yakuma-hero__label--software">SOFTWARE<br />THAT WORKS</span>
      <span className="yakuma-hero__label yakuma-hero__label--games">GAMES<br />THAT CONNECT</span>
      <span className="yakuma-hero__label yakuma-hero__label--brands">BRANDS<br />THAT LAST</span>
    </div>
    <div className="yakuma-hero__lockup">
      <span className="yakuma-hero__kana" lang="ja">ヤクマ</span>
      <h1 id="yakuma-title">YAKUMA</h1>
      <p className="yakuma-hero__tagline">DELIVERING EXCELLENCE</p>
    </div>
    <span className="yakuma-hero__registered" aria-hidden="true">®</span>
    <HeroActions language={language} />
    <div className="yakuma-hero__perimeter" aria-hidden="true"><i /><i /><i /><i /></div>
    <HeroTelemetry />
    <div className="yakuma-hero__closing">
      <span>© 2026 YAKUMA. ALL RIGHTS RESERVED.</span>
      <span className="yakuma-hero__signature"><Micrographic name="signal" />EMBRACE HUMAN DIGITAL TOMORROW</span>
    </div>
  </section>;
}
