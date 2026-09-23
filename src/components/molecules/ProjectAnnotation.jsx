import logic from '../../assets/design/hoshi-logic.svg';
import corners from '../../assets/design/logic-corners.svg';
import orbit from '../../assets/design/project-orbit.svg';
import frequency from '../../assets/design/frequency-arrows.svg';

export default function ProjectAnnotation({ side }) {
  const left = side === 'left';
  return <aside className={`project-annotation project-annotation--${side}`} aria-hidden="true">
    <p className="project-annotation__index">{left ? '01 / LOGIC IN PLAY' : 'DESIGN → BUILD → PLAY'}</p>
    <div className="project-annotation__art">
      <img className="project-annotation__symbol" src={left ? logic : orbit} alt="" />
      <img className={left ? 'project-annotation__corners' : 'project-annotation__frequency'} src={left ? corners : frequency} alt="" />
    </div>
    <p className="project-annotation__caption">{left ? <>ROWS / DIAGONALS<br />TRIANGLE REGIONS</> : <>A NEW SHAPE.<br />A FAMILIAR CHALLENGE.</>}</p>
    <p className="project-annotation__reference">{left ? 'REF. HS-001' : 'YAKUMA / GAME DEVELOPMENT'}</p>
  </aside>;
}
