// One number with a label (e.g. "27 Total findings"). `tone` colours the number.
export default function StatCard({ value, suffix, label, tone }) {
  return (
    <div className="card stat">
      <div className={`stat-value ${tone || ''}`}>
        {value}{suffix && <span className="stat-suffix">{suffix}</span>}
      </div>
      <div className="muted">{label}</div>
    </div>
  );
}
