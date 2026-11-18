// Small coloured label. Used for severity (Critical/High/...) and status (Open/Resolved/...).
// The colour comes from the CSS class "badge-<value>" in index.css.
export default function StatusBadge({ value }) {
  const cls = value.toLowerCase().replace(/\s+/g, '-');
  return <span className={`badge badge-${cls}`}>{value}</span>;
}
