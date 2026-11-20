import { useState } from 'react';
import { Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import FindingsTable from '../components/FindingsTable';
import FindingDetail from '../components/FindingDetail';
import DemoNotice from '../components/DemoNotice';

const SEVERITIES = ['All', 'Low', 'Medium', 'High', 'Critical'];

export default function Findings() {
  const { findings } = useApp();
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('All');
  const [status, setStatus] = useState('All');
  const [selectedId, setSelectedId] = useState(null);

  // Filtering happens on every render: keep a finding only if it passes all three checks.
  const text = query.trim().toLowerCase();
  const visible = findings.filter((f) =>
    (severity === 'All' || f.severity === severity) &&
    (status === 'All' || f.status === status) &&
    (!text || [f.title, f.source, f.category].some((v) => v.toLowerCase().includes(text)))
  );

  const clearFilters = () => {
    setQuery('');
    setSeverity('All');
    setStatus('All');
  };

  return (
    <div className="stack">
      <DemoNotice>Simulated demonstration audit findings across 6 public intelligence sources.</DemoNotice>
      <div className="card stack">
        <div className="row gap wrap">
          <div className="search">
            <Search size={16} aria-hidden="true" />
            <input
              placeholder="Search title, source, or category"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search findings"
            />
          </div>
          <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="All">All statuses</option>
            <option>Open</option>
            <option>Reviewing</option>
            <option>Resolved</option>
          </select>
        </div>
        <div className="row gap wrap" role="group" aria-label="Filter by severity">
          {SEVERITIES.map((s) => (
            <button
              key={s}
              className={`chip ${severity === s ? 'active' : ''}`}
              onClick={() => setSeverity(s)}
              aria-pressed={severity === s}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="muted small">Showing {visible.length} of {findings.length} findings</p>
        {visible.length === 0
          ? (
            <div className="empty" role="status">
              <strong>No findings match your filter.</strong>
              <p className="muted" style={{ marginTop: 4 }}>
                Try adjusting your search query, severity, or remediation status.
              </p>
              <button className="btn btn-sm" onClick={clearFilters} style={{ marginTop: 12 }}>
                Reset all filters
              </button>
            </div>
          )
          : <FindingsTable findings={visible} onSelect={(f) => setSelectedId(f.id)} />}
      </div>
      {selectedId && <FindingDetail findingId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
