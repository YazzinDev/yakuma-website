import Micrographic from '../atoms/Micrographic';
import barcode from '../../assets/design/textile-stripe.svg';

export default function GarmentLabel() {
  return <aside className="garment-label" aria-label="Yakuma, About, edition 2026">
    <div className="garment-label__edition"><Micrographic /><span>ED. 2026<br />REV. 01</span></div>
    <div className="garment-label__brand"><strong>YAKUMA</strong><span>ABOUT<br />SECTION / 02</span></div>
    <p>REF. YK-02 / HUMAN FIRST</p>
    <div className="garment-label__statement"><p>NEXT MOVE: <span className="garment-label__redacted" aria-label="unknown">UNKNOWN</span>.<br />MAKE IT MATTER.</p><span>03 FIELDS<br />ONE STUDIO</span></div>
    <div className="garment-label__barcode"><img src={barcode} alt="" /><span>YK / 0026</span></div>
  </aside>;
}
