import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import CarouselArrowButton from '../atoms/CarouselArrowButton';

function normalizeIndex(index, length) {
  return (index + length) % length;
}

function ProjectCard({ item, isActive = false }) {
  const activeClassName = isActive ? ' project-card--active' : '';

  if (item.kind === 'project') {
    return (
      <Link
        aria-label={`${item.title} - ${item.linkLabel}`}
        className={`project-card project-card--featured project-card--linkable${activeClassName}`}
        to={item.href}
      >
        <div className="project-card__phone">
          <img alt={item.imageAlt} src={item.image} />
        </div>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <span className="button button--text project-card__link">
          <span className="project-card__link-text">{item.linkLabel}</span>
        </span>
      </Link>
    );
  }

  return (
    <article
      aria-disabled="true"
      aria-label={item.label}
      className={`project-card project-card--side project-card--disabled${activeClassName}`}
    >
      <div aria-hidden="true" className="project-card__skeleton">
        <span className="project-card__skeleton-visual">
          <span className="project-card__empty-icon" />
        </span>
        <span className="project-card__skeleton-line project-card__skeleton-line--wide" />
        <span className="project-card__skeleton-line" />
        <span className="project-card__skeleton-line project-card__skeleton-line--short" />
      </div>
      <span className="project-card__placeholder-label">{item.label}</span>
    </article>
  );
}

export default function ProjectCarousel({ items, labels }) {
  const projectIndexes = items
    .map((item, index) => (item.kind === 'project' ? index : -1))
    .filter((index) => index >= 0);
  const [activeIndex, setActiveIndex] = useState(projectIndexes[0] ?? 0);
  const pointerStartX = useRef(null);
  const suppressNextClick = useRef(false);
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;
  const canCycle = projectIndexes.length > 1;
  const visibleItems = [
    items[normalizeIndex(safeActiveIndex - 1, items.length)],
    items[safeActiveIndex],
    items[normalizeIndex(safeActiveIndex + 1, items.length)],
  ];
  const shellClassName = `project-carousel-shell${canCycle ? '' : ' project-carousel-shell--static'}`;

  const moveProject = (direction) => {
    if (!canCycle) {
      return;
    }

    setActiveIndex((current) => {
      const currentProjectIndex = projectIndexes.indexOf(current);
      const safeProjectIndex = currentProjectIndex >= 0 ? currentProjectIndex : 0;

      return projectIndexes[normalizeIndex(safeProjectIndex + direction, projectIndexes.length)];
    });
  };

  const handlePointerDown = (event) => {
    if (!canCycle || !event.isPrimary) {
      return;
    }

    pointerStartX.current = event.clientX;
  };

  const handlePointerUp = (event) => {
    if (pointerStartX.current === null || !event.isPrimary) {
      return;
    }

    const deltaX = event.clientX - pointerStartX.current;
    pointerStartX.current = null;

    if (Math.abs(deltaX) < 44) {
      return;
    }

    suppressNextClick.current = true;
    moveProject(deltaX > 0 ? -1 : 1);
  };

  const handleClickCapture = (event) => {
    if (!suppressNextClick.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    suppressNextClick.current = false;
  };

  return (
    <div className={shellClassName} data-project-carousel>
      <CarouselArrowButton
        direction="previous"
        disabled={!canCycle}
        label={labels.previous}
        onClick={() => moveProject(-1)}
      />
      <div
        aria-live="polite"
        className="project-carousel"
        onClickCapture={handleClickCapture}
        onPointerCancel={() => {
          pointerStartX.current = null;
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {visibleItems.map((item, index) => (
          <ProjectCard isActive={index === 1} item={item} key={`${item.id}-${index}`} />
        ))}
      </div>
      <CarouselArrowButton
        direction="next"
        disabled={!canCycle}
        label={labels.next}
        onClick={() => moveProject(1)}
      />
    </div>
  );
}
