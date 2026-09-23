import Micrographic from '../atoms/Micrographic';

export default function PrivacyIdentity({ language }) {
  return <div className="privacy-identity" aria-hidden="true">
    <div className="privacy-identity__caption"><span>YK / DOCUMENT</span><span>01</span></div>
    <Micrographic preserveAspectRatio="none" />
    <svg viewBox="0 0 72 80" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M36 3l32 12v24c0 18-16 31-32 38-16-7-32-20-32-38v-24z m0 25c-6 0-9 4-9 9 0 4 3 7 6 8v10h6v-10c3-1 6-4 6-8 0-5-3-9-9-9z" />
    </svg>
    <span className="privacy-identity__name">PRIVACY <span>/ {language.toUpperCase()}</span></span>
  </div>;
}
