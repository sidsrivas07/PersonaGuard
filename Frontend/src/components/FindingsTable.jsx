import StatusBadge from './StatusBadge';

// Table of findings. Clicking a row calls onSelect(finding) so the parent can open the detail view.
export default function FindingsTable({ findings, onSelect, compact = false }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Finding</th><th>Source</th>
            {!compact && <th>Category</th>}
            <th>Severity</th>
            {!compact && <th>Found</th>}
            <th>Status</th>
            {compact && <th>Recommended action</th>}
          </tr>
        </thead>
        <tbody>
          {findings.map((f) => (
            <tr key={f.id} className="clickable" tabIndex={0} onClick={() => onSelect(f)} onKeyDown={(e) => e.key === 'Enter' && onSelect(f)}>
              <td>{f.title}</td>
              <td className="muted">{f.source}</td>
              {!compact && <td className="muted">{f.category}</td>}
              <td><StatusBadge value={f.severity} /></td>
              {!compact && <td className="muted">{f.dateFound}</td>}
              <td><StatusBadge value={f.status} /></td>
              {compact && <td className="muted">{f.recommendedAction}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
