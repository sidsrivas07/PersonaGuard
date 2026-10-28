import { Play } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SOURCES } from '../data/mockData';
import StatCard from '../components/StatCard';
import ExposureScore from '../components/ExposureScore';
import SeverityChart from '../components/SeverityChart';
import ExposureTrendChart from '../components/ExposureTrendChart';
import FindingsTable from '../components/FindingsTable';
import FindingDetail from '../components/FindingDetail';
import DemoNotice from '../components/DemoNotice';
import StatusBadge from '../components/StatusBadge';
import { useState } from 'react';

const ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export default function Dashboard() {
  const { profile, findings, openFindings, exposureScore, severityCounts, trendData, remediation, runScan, setPage, toggleRemediation } = useApp();
  const [selectedId, setSelectedId] = useState(null);

  const critical = openFindings.filter((f) => f.severity === 'Critical').length;
  const recent = [...openFindings].sort((a, b) => ORDER[a.severity] - ORDER[b.severity]).slice(0, 5);
  const nextActions = remediation.filter((a) => a.status !== 'Completed').slice(0, 3);

  const startDemoScan = () => { setPage('scans'); runScan(); };

  return (
    <div className="stack">
      <div className="row between wrap">
        <div>
          <h2>Welcome back, {profile.fullName.split(' ')[0]}</h2>
          <p className="muted">Here is what your demonstration footprint looks like today.</p>
        </div>
        <button className="btn primary" onClick={startDemoScan}><Play size={16} />Start demonstration scan</button>
      </div>
      <DemoNotice>Demonstration data from the project presentation (68/100, 27 findings, 4 critical, 6 sources).</DemoNotice>

      <ExposureScore score={exposureScore} />

      <div className="grid-4">
        <StatCard value={exposureScore} suffix="/100" label="Exposure score" tone="accent" />
        <StatCard value={findings.length} label="Total findings" />
        <StatCard value={critical} label="Critical findings (open)" tone="critical" />
        <StatCard value={SOURCES.length} label="Sources scanned" />
      </div>

      <div className="grid-2">
        <SeverityChart data={severityCounts} />
        <ExposureTrendChart data={trendData} />
      </div>

      <div className="card">
        <div className="row between"><h3>Recent findings</h3><button className="link" onClick={() => setPage('findings')}>View all findings</button></div>
        <FindingsTable findings={recent} onSelect={(f) => setSelectedId(f.id)} compact />
      </div>

      <div className="card">
        <h3>Recommended actions</h3>
        {nextActions.length === 0 && <p className="muted">All demonstration actions are complete.</p>}
        {nextActions.map((a) => (
          <div className="list-row" key={a.id}>
            <div><strong>{a.title}</strong><div className="muted small">{a.description}</div></div>
            <div className="row gap"><StatusBadge value={a.priority} /><button className="btn" onClick={() => toggleRemediation(a.id)}>Mark complete</button></div>
          </div>
        ))}
      </div>

      {selectedId && <FindingDetail findingId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
