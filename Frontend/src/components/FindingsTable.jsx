import StatusBadge from './StatusBadge';

// Table of findings. Clicking a row calls onSelect(finding) so the parent can open the detail view.
export default function FindingsTable({ findings, onSelect, compact = false }) {
  return (
    <div className="table-wrap">
      <table className="table" aria-label="Digital footprint findings table">
        <thead>
          <tr>
            <th scope="col">Finding</th>
            <th scope="col">Source</th>
            {!compact && <th scope="col">Category</th>}
            <th scope="col">Severity</th>
            {!compact && <th scope="col">Found</th>}
            <th scope="col">Status</th>
            {compact && <th scope="col">Recommended action</th>}
          </tr>
        </thead>
        <tbody>
          {findings.map((f) => (
            <tr
              key={f.id}
              className="clickable"
              role="button"
              tabIndex={0}
              onClick={() => onSelect(f)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(f)}
              aria-label={`View details for: ${f.title}`}
            >
              <td>
                <div style={{ fontWeight: 500 }}>{f.title}</div>
                {f.maskedValue && <div className="masked-val tabular">{f.maskedValue}</div>}
              </td>
              <td className="muted">{f.source}</td>
              {!compact && <td className="muted">{f.category}</td>}
              <td><StatusBadge value={f.severity} /></td>
              {!compact && <td className="muted tabular">{f.dateFound}</td>}
              <td><StatusBadge value={f.status} /></td>
              {compact && <td className="muted">{f.recommendedAction}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
