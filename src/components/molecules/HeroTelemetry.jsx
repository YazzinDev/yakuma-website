import barcode from '../../assets/design/yakuma-barcode.svg';
import directional from '../../assets/design/directional.svg';

export default function HeroTelemetry() {
  return <div className="hero-telemetry">
    <span className="hero-telemetry__status"><i aria-hidden="true" />SYSTEMS ONLINE</span>
    <img className="hero-telemetry__barcode" src={barcode} alt="" width="288" height="28" />
    <span className="hero-telemetry__caption">YAKUMA / HUMAN BY DESIGN</span>
    <span className="hero-telemetry__version">V.01 / 2026</span>
    <span className="hero-telemetry__time">05:00 PM</span>
    <img className="hero-telemetry__direction" src={directional} alt="" width="26" height="26" />
  </div>;
}
