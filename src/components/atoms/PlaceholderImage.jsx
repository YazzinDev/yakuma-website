export default function PlaceholderImage({ alt, src, className = '', fetchPriority = 'auto', loading = 'lazy' }) {
  return (
    <figure className={`placeholder-image ${className}`.trim()}>
      <img alt={alt} decoding="async" fetchpriority={fetchPriority} loading={loading} src={src} />
    </figure>
  );
}
