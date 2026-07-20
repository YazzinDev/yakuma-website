export default function FaqItem({ answer, question }) {
  function restoreSummaryPosition(summary, topBeforeToggle) {
    const topAfterToggle = summary.getBoundingClientRect().top;
    const delta = topAfterToggle - topBeforeToggle;

    if (Math.abs(delta) > 1) {
      window.scrollTo({ left: 0, top: window.scrollY + delta, behavior: 'auto' });
    }
  }

  function keepSummaryPosition(event) {
    event.preventDefault();

    const summary = event.currentTarget;
    const item = summary.closest('details');
    if (!item) {
      return;
    }

    const topBeforeToggle = summary.getBoundingClientRect().top;
    item.open = !item.open;

    restoreSummaryPosition(summary, topBeforeToggle);
    requestAnimationFrame(() => restoreSummaryPosition(summary, topBeforeToggle));
    setTimeout(() => restoreSummaryPosition(summary, topBeforeToggle), 80);
  }

  return (
    <details className="faq-item">
      <summary onClickCapture={keepSummaryPosition}>
        <span className="faq-item__question">{question}</span>
      </summary>
      <p>{answer}</p>
    </details>
  );
}
