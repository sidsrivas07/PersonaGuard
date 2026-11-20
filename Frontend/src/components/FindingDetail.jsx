import { useEffect } from 'react';
import { X } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { useApp } from '../context/AppContext';

// Slide-over panel with the full detail of one finding. Reads the live finding from context
// so a status change updates the exposure score and dashboard immediately.
export default function FindingDetail({ findingId, onClose }) {
  const { findings, setFindingStatus } = useApp();
  const f = findings.find((x) => x.id === findingId);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!f) return null;

  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <aside
        className="drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Details for: ${f.title}`}
      >
        <button className="icon-btn drawer-close" onClick={onClose} aria-label="Close finding details">
          <X size={18} />
        </button>
        <div className="row gap">
          <StatusBadge value={f.severity} />
          <StatusBadge value={f.status} />
        </div>
        <h2>{f.title}</h2>
        <dl className="details">
          <dt>Source</dt>
          <dd>{f.source}</dd>
          <dt>Category</dt>
          <dd>{f.category}</dd>
          {f.maskedValue && (
            <>
              <dt>Exposed value</dt>
              <dd><code className="masked-val tabular">{f.maskedValue}</code></dd>
            </>
          )}
          <dt>Date discovered</dt>
          <dd className="tabular">{f.dateFound}</dd>
          <dt>Confidence</dt>
          <dd className="tabular">{f.confidence}% (simulated)</dd>
          <dt>Recommended action</dt>
          <dd>{f.recommendedAction}</dd>
        </dl>
        <label className="field">
          <span>Remediation status</span>
          <select
            value={f.status}
            onChange={(e) => setFindingStatus(f.id, e.target.value)}
            aria-label="Change remediation status"
          >
            <option>Open</option>
            <option>Reviewing</option>
            <option>Resolved</option>
          </select>
        </label>
        <p className="muted small">
          Marking as Resolved removes this item from your exposure calculation and recalculates your score in real time.
        </p>
      </aside>
    </div>
  );
}
