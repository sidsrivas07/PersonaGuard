import { Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SOURCES } from '../data/mockData';
import SeverityChart from '../components/SeverityChart';
import ExposureTrendChart from '../components/ExposureTrendChart';

export default function Reports() {
  const { exposureScore, severityCounts, trendData, remediation, findings, profile } = useApp();
  const done = remediation.filter((a) => a.status === 'Completed').length;

  return (
    <div className="stack">
      <div className="row between wrap no-print">
        <p className="muted">A summary of the demonstration data. To save as PDF, choose "Save as PDF" in the print window.</p>
        {/* window.print() opens the browser's print dialog. A print stylesheet in index.css hides the menu. */}
        <button className="btn primary" onClick={() => window.print()}><Download size={16} />Download PDF report</button>
      </div>

      <div className="card stack">
        <h2>PersonaGuard privacy report (demonstration)</h2>
        <p className="muted">Prepared for {profile.fullName}. This report uses simulated data and does not describe a real scan.</p>
        <div className="grid-4">
          <div><div className="muted small">Exposure score</div><strong className="big">{exposureScore}/100</strong></div>
          <div><div className="muted small">Total findings</div><strong className="big">{findings.length}</strong></div>
          <div><div className="muted small">Sources processed</div><strong className="big">{SOURCES.length}</strong></div>
          <div><div className="muted small">Actions completed</div><strong className="big">{done}/{remediation.length}</strong></div>
        </div>
      </div>

      <div className="grid-2">
        <SeverityChart data={severityCounts} />
        <ExposureTrendChart data={trendData} />
      </div>

      <div className="card">
        <h3>Sources processed</h3>
        <ul className="plain">{SOURCES.map((s) => <li key={s}>{s}</li>)}</ul>
      </div>

      <div className="card">
        <h3>Recommended actions</h3>
        <ul className="plain">{remediation.map((a) => <li key={a.id}>{a.status === 'Completed' ? '[done]' : '[ ]'} {a.title} ({a.priority})</li>)}</ul>
      </div>
    </div>
  );
}
