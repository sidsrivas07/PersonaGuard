import { X } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { useApp } from '../context/AppContext';

// Slide-over panel with the full detail of one finding. Reads the live finding from context
// so a status change shows up everywhere immediately.
export default function FindingDetail({ findingId, onClose }) {
  const { findings, setFindingStatus } = useApp();
  const f = findings.find((x) => x.id === findingId);
  if (!f) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Finding details">
        <button className="icon-btn drawer-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <div className="row gap"><StatusBadge value={f.severity} /><StatusBadge value={f.status} /></div>
        <h2>{f.title}</h2>
        <dl className="details">
          <dt>Source</dt><dd>{f.source}</dd>
          <dt>Category</dt><dd>{f.category}</dd>
          <dt>Date discovered</dt><dd>{f.dateFound}</dd>
          <dt>Classifier confidence</dt><dd>{f.confidence}% (simulated)</dd>
          <dt>Recommended action</dt><dd>{f.recommendedAction}</dd>
        </dl>
        <label className="field">
          <span>Status</span>
          <select value={f.status} onChange={(e) => setFindingStatus(f.id, e.target.value)}>
            <option>Open</option><option>Reviewing</option><option>Resolved</option>
          </select>
        </label>
        <p className="muted small">This is demonstration data. Changing the status only updates this demo, not any real website or account.</p>
      </aside>
    </div>
  );
}
