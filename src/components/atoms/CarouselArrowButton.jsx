export default function CarouselArrowButton({ direction, disabled = true, label, onClick }) {
  return (
    <button
      aria-label={label}
      className={`carousel-arrow carousel-arrow--${direction}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span aria-hidden="true" />
    </button>
  );
}
