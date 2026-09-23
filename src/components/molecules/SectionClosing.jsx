import signature from '../../assets/design/pixel-signature.svg';

export default function SectionClosing({ children, symbol = signature }) {
  return <div className="section-closing"><span>{children}</span>{symbol && <img src={symbol} alt="" />}</div>;
}
