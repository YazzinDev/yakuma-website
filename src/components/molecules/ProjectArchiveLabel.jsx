import stripe from '../../assets/design/textile-stripe.svg';

export default function ProjectArchiveLabel() {
  return <aside className="project-archive-label" aria-label="Hoshi project archive, reference 001">
    <div className="project-archive-label__edition"><span>PROJECT ARCHIVE / 001</span><span>ED. 2026</span></div>
    <div className="project-archive-label__brand"><strong>YK-HOSHI</strong><span>STAR SUDOKU<br />GAME / MOBILE</span></div>
    <span className="project-archive-label__mobile-index">REF. 001</span>
    <div className="project-archive-label__serial"><img src={stripe} alt="" /><span>REF. YK-HS-01<br />DESIGNED TO PLAY</span></div>
  </aside>;
}
