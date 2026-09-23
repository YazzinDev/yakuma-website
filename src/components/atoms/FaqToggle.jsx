export default function FaqToggle({ open }) {
  return <svg className="faq-toggle" viewBox="0 0 40 40" aria-hidden="true" focusable="false" data-pencil-node="upyi8">
    <path className="faq-toggle__corners" d="M0 10v-10h10m20 0h10v10m0 20v10h-10m-20 0h-10v-10" fill="none" stroke="currentColor" />
    <path d="M12 20h16" fill="none" stroke="currentColor" strokeWidth="1.5" />
    {!open && <path d="M20 12v16" fill="none" stroke="currentColor" strokeWidth="1.5" />}
  </svg>;
}
