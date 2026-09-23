import ProjectArchiveLabel from '../molecules/ProjectArchiveLabel';
import ProjectAnnotation from '../molecules/ProjectAnnotation';
import FeaturedProjectWindow from '../molecules/FeaturedProjectWindow';
import SectionClosing from '../molecules/SectionClosing';
import '../../styles/yakuma-projects.css';

export default function YakumaProjects({ language }) {
  return <section className="yakuma-projects" id="projects" aria-labelledby="projects-title">
    <h2 id="projects-title">{language === 'de' ? 'PROJEKTE.' : 'PROJECTS.'}</h2>
    <p className="yakuma-projects__subtitle">{language === 'de' ? 'Entdecke, was wir entwickeln.' : 'Discover what we’re building.'}</p>
    <ProjectArchiveLabel />
    <div className="yakuma-projects__showcase">
      <ProjectAnnotation side="left" />
      <FeaturedProjectWindow language={language} />
      <ProjectAnnotation side="right" />
    </div>
    <SectionClosing symbol={false}><span>YAKUMA / PROJECT ARCHIVE</span><span className="yakuma-projects__edition">2026 / 01 FEATURED PROJECTS</span></SectionClosing>
  </section>;
}
