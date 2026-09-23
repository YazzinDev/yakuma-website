import WindowChrome from '../atoms/WindowChrome';

export default function CapabilityWindow({ item }) {
  return <article className={`capability-window capability-window--${item.id}`}>
    <WindowChrome filename={item.filename} />
    <div className="capability-window__identity">
      <svg className="capability-window__brackets" aria-hidden="true" viewBox="0 0 432 144" preserveAspectRatio="none"><path d="M1 21v-20h20m390 0h20v20m0 102v20h-20m-390 0h-20v-20" /></svg>
      <h3><span className="capability-window__shadow" aria-hidden="true">{item.title}</span>{item.title}</h3>
      <img src={item.icon} alt="" />
    </div>
    <p>{item.description}</p>
  </article>;
}
