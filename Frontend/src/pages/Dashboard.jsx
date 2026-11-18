import { Play } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SOURCES } from '../data/mockData';
import ExposureScore from '../components/ExposureScore';
import SeverityChart from '../components/SeverityChart';
import ExposureTrendChart from '../components/ExposureTrendChart';
import FindingDetail from '../components/FindingDetail';
import DemoNotice from '../components/DemoNotice';
import StatusBadge from '../components/StatusBadge';

// Severity sort order for the "needs attention" list
const ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

// One-click action labels per finding type
function quickActionLabel(finding) {
  if (finding.category === 'Contact info')    return 'Hide contact info';
  if (finding.category === 'Personal details') return 'Request takedown';
  if (finding.category === 'Breach')          return 'Change password';
  if (finding.category === 'Image match')     return 'Review match';
  return 'Mark resolved';
}

export default function Dashboard() {
  const {
    profile, findings, openFindings, exposureScore,
    severityCounts, trendData, setPage, runScan, setFindingStatus,
  } = useApp();

  const [selectedId, setSelectedId] = useState(null);

  // Derived counts for stats strip
  const resolvedCount  = findings.filter((f) => f.status === 'Resolved').length;
  const critical       = openFindings.filter((f) => f.severity === 'Critical').length;

  // Top 3 open findings by severity for the "needs attention" panel
  const topFindings = [...openFindings]
    .sort((a, b) => ORDER[a.severity] - ORDER[b.severity])
    .slice(0, 3);

  // Data-driven header subtitle
  const attentionCount = openFindings.filter((f) => f.severity === 'Critical' || f.severity === 'High').length;
  const subtitle = attentionCount > 0
    ? `${attentionCount} item${attentionCount !== 1 ? 's' : ''} need your attention`
    : 'Your footprint looks clean — keep it that way.';

  const startScan = () => { setPage('scans'); runScan(); };

  // One-click resolve: marks finding as Resolved and lets the score recompute
  const resolveNow = (finding) => {
    setFindingStatus(finding.id, 'Resolved');
  };

  return (
    <div className="stack">
      {/* ── Demo Banner (thin, dismissible) ─────────────────────────── */}
      <DemoNotice>
        Demo data &mdash; {exposureScore}/100 &middot; {findings.length} findings &middot; {critical} critical &middot; {SOURCES.length} sources
      </DemoNotice>

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="dash-header row between wrap">
        <div>
          <h2>Welcome back, {profile.fullName.split(' ')[0]}</h2>
          <p className="muted" style={{ marginTop: 2 }}>{subtitle}</p>
        </div>
        <button className="btn primary" onClick={startScan} aria-label="Run a new scan">
          <Play size={15} aria-hidden="true" />
          Run scan
        </button>
      </div>

      {/* ── Hero Row: Score Gauge + Needs Attention ──────────────────── */}
      <div className="hero-row">
        {/* Left: Gauge */}
        <ExposureScore score={exposureScore} />

        {/* Right: Needs attention */}
        <div className="attention-card hero-card">
          <div className="row between" style={{ marginBottom: 12 }}>
            <h3 style={{ marginBottom: 0 }}>Needs your attention</h3>
            <button className="link" onClick={() => setPage('findings')} aria-label="View all findings">
              View all findings
            </button>
          </div>

          {topFindings.length === 0 ? (
            <p className="muted" style={{ fontSize: 14 }}>No open findings — great work!</p>
          ) : (
            <ul className="attention-list" role="list">
              {topFindings.map((f) => (
                <li key={f.id} className="attention-item">
                  <StatusBadge value={f.severity} />
                  <div className="attention-body">
                    <div
                      className="attention-title"
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedId(f.id)}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedId(f.id)}
                      aria-label={`View details for: ${f.title}`}
                    >
                      {f.title}
                    </div>
                    <div className="attention-meta">
                      <span className="source-chip">{f.source}</span>
                      {f.maskedValue && (
                        <span className="masked-val">{f.maskedValue}</span>
                      )}
                    </div>
                  </div>
                  <button
                    className="btn btn-sm"
                    onClick={() => resolveNow(f)}
                    aria-label={`${quickActionLabel(f)}: ${f.title}`}
                  >
                    {quickActionLabel(f)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Slim Stats Strip ────────────────────────────────────────── */}
      <div className="stats-strip">
        <div className="stat-item">
          <span className="stat-num">{findings.length}</span>
          <span className="stat-lbl">Total findings</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-num">{openFindings.length}</span>
          <span className="stat-lbl">Open</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-num">{resolvedCount}</span>
          <span className="stat-lbl">Resolved</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-num">{SOURCES.length}</span>
          <span className="stat-lbl">Sources scanned</span>
        </div>
      </div>

      {/* ── Bottom Row: Charts ───────────────────────────────────────── */}
      <div className="grid-2">
        <SeverityChart data={severityCounts} />
        <ExposureTrendChart data={trendData} />
      </div>

      {/* Finding detail drawer */}
      {selectedId && <FindingDetail findingId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
