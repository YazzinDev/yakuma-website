// Native path geometry from the canonical Pencil atoms, not raster exports.
const markers = {
  frequency: {
    node: 'EbFZ9', viewBox: '0 0 240 28',
    path: 'M0 24l9-20h4l-9 20z m13 0l9-20h4l-9 20z m12.52941 0l9-20h4l-9 20z m12.05883 0l9-20h4l-9 20z m11.58823 0l9-20h4l-9 20z m11.11765 0l9-20h4l-9 20z m10.64706 0l9-20h4l-9 20z m10.17647 0l9-20h4l-9 20z m9.70588 0l9-20h4l-9 20z m9.23529 0l9-20h4l-9 20z m8.76471 0l9-20h4l-9 20z m8.29412 0l9-20h4l-9 20z m7.82353 0l9-20h4l-9 20z m7.35294 0l9-20h4l-9 20z m6.88235 0l9-20h4l-9 20z m6.41177 0l9-20h4l-9 20z m5.94117 0l9-20h4l-9 20z m5.47059 0l9-20h4l-9 20z m5 0l9-20h69l-9 20z',
  },
  brackets: {
    node: 'xdbpE', viewBox: '0 0 110 44',
    path: 'M1 11v-10h10m88 0h10v10m-108 22v10h10m88 0h10v-10', stroke: true,
  },
  signal: {
    node: 'gSAJi', viewBox: '0 0 168 8', path: 'M0 4h56m56 0h56', stroke: true,
  },
};

export default function Micrographic({ name = 'frequency', className = '', preserveAspectRatio = 'xMidYMid meet' }) {
  const graphic = markers[name];
  if (!graphic) throw new Error(`Unknown micrographic: ${name}`);
  return (
    <svg aria-hidden="true" focusable="false" className={`micrographic micrographic--${name} ${className}`.trim()}
      viewBox={graphic.viewBox} preserveAspectRatio={preserveAspectRatio} data-pencil-node={graphic.node}>
      <path d={graphic.path} fill={graphic.stroke ? 'none' : 'currentColor'}
        stroke={graphic.stroke ? 'currentColor' : undefined} strokeWidth="1" />
      {name === 'signal' && [68, 76, 84, 92, 100].map(x => <circle key={x} cx={x} cy="4" r="2" fill="currentColor" />)}
    </svg>
  );
}
