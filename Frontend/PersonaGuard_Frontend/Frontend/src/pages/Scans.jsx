import { useState } from 'react';
import { Play, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getSimulatedImageMatches } from '../services/scanService';
import StatusBadge from '../components/StatusBadge';
import DemoNotice from '../components/DemoNotice';

export default function Scans() {
  const { scans, scanState, runScan, profile, referencePhoto, setPage, setScanState } = useApp();
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [reviews, setReviews] = useState({}); // matchId -> 'Confirmed' | 'Rejected'
  const matches = getSimulatedImageMatches();

  const scanning = scanState.status === 'scanning';
  const canScan = profile.consentGiven && !scanning;

  return (
    <div className="stack">
      <DemoNotice>Scans here are simulations that run on timers. No website, breach database or search engine is contacted.</DemoNotice>

      <div className="card stack">
        <div className="row between wrap">
          <div className="row gap"><h3>Scan status</h3><StatusBadge value={scanState.status === 'ready' ? 'Ready' : scanState.status === 'scanning' ? 'Scanning' : scanState.status === 'completed' ? 'Completed' : 'Failed'} /></div>
          <button className="btn primary" disabled={!canScan} onClick={() => runScan({ simulateFailure })}><Play size={16} />Start demonstration scan</button>
        </div>

        {!profile.consentGiven && (
          <div className="notice warn">Consent is needed before a scan. <button className="link" onClick={() => setPage('identity')}>Open My Identity</button></div>
        )}

        <label className="check"><input type="checkbox" checked={simulateFailure} disabled={scanning} onChange={(e) => setSimulateFailure(e.target.checked)} />Make the next scan fail (to demonstrate the error state)</label>

        {scanning && (
          <div>
            <div className="progress"><div className="progress-bar" style={{ width: `${scanState.progress}%` }} /></div>
            <p className="muted small">{scanState.progress}% · Simulating: {scanState.currentSource}</p>
          </div>
        )}
        {scanState.status === 'completed' && <div className="notice success"><CheckCircle2 size={16} />Simulated scan completed. The sample findings are unchanged. <button className="link" onClick={() => setPage('findings')}>View findings</button></div>}
        {scanState.status === 'failed' && <div className="notice error"><AlertTriangle size={16} />{scanState.error} <button className="link" onClick={() => setScanState({ status: 'ready', progress: 0, currentSource: '', error: '' })}>Dismiss</button></div>}
      </div>

      <div className="card">
        <h3>Scan history</h3>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Scan</th><th>Date</th><th>Status</th><th>Findings</th><th>Sources processed</th></tr></thead>
            <tbody>
              {scans.map((s) => (
                <tr key={s.id + s.date}>
                  <td>{s.id}</td><td className="muted">{s.date}</td>
                  <td><StatusBadge value={s.status} />{s.error && <div className="muted small">{s.error}</div>}</td>
                  <td>{s.findings}</td><td>{s.sources}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card stack">
        <h3>Image matching preview (simulated)</h3>
        <div className="notice warn">Simulated candidates only. No real photo was searched or found. A match similarity shows how alike two images look. It is not your exposure score. Real results will come from the separate face-matching module, and you review every match.</div>
        {!referencePhoto && <p className="muted small">No reference photo added. <button className="link" onClick={() => setPage('identity')}>Add one in My Identity</button> (optional).</p>}
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Candidate image</th><th>Source</th><th>Match similarity</th><th>Review</th></tr></thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.id}>
                  <td>{m.reference}</td><td className="muted">{m.source}</td><td>{m.similarity}%</td>
                  <td>
                    {reviews[m.id] ? <StatusBadge value={reviews[m.id]} /> : (
                      <div className="row gap">
                        <button className="btn" onClick={() => setReviews({ ...reviews, [m.id]: 'Confirmed' })}>Confirm</button>
                        <button className="btn" onClick={() => setReviews({ ...reviews, [m.id]: 'Rejected' })}>Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
