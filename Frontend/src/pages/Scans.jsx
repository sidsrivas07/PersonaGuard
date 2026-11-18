import { useState, useEffect } from 'react';
import { Play, CheckCircle2, AlertTriangle, ScanFace, Sliders, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchImageMatches, getSimulatedImageMatches } from '../services/scanService';
import StatusBadge from '../components/StatusBadge';
import DemoNotice from '../components/DemoNotice';

export default function Scans() {
  const { scans, scanState, runScan, profile, referencePhoto, setPage, setScanState } = useApp();
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [reviews, setReviews] = useState({}); // matchId -> 'Confirmed' | 'Rejected'
  
  // Face-matching state
  const [matchData, setMatchData] = useState({
    isLive: false,
    threshold: 0.45,
    matches: getSimulatedImageMatches(),
  });
  const [threshold, setThreshold] = useState(0.45);
  const [matchingLoading, setMatchingLoading] = useState(false);

  const scanning = scanState.status === 'scanning';
  const canScan = profile.consentGiven && !scanning;

  const runFaceMatch = async () => {
    setMatchingLoading(true);
    try {
      const res = await fetchImageMatches({
        threshold,
        referenceFile: referencePhoto?.file || null,
      });
      setMatchData(res);
    } catch (err) {
      console.error('Face match failed:', err);
    } finally {
      setMatchingLoading(false);
    }
  };

  useEffect(() => {
    runFaceMatch();
  }, [referencePhoto]);

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

      {/* Face Matching Module Section */}
      <div className="card stack">
        <div className="row between wrap">
          <div className="row gap">
            <ScanFace size={20} style={{ color: 'var(--accent)' }} />
            <h3>Image Matching & Face Tracking</h3>
            {matchData.isLive ? (
              <span className="badge badge-confirmed">InsightFace Engine Live</span>
            ) : (
              <span className="badge badge-medium">Simulated Preview</span>
            )}
          </div>
          <div className="row gap">
            <div className="row gap" style={{ fontSize: '13px', color: 'var(--muted)' }}>
              <Sliders size={14} />
              <span>Threshold: <strong>{threshold}</strong></span>
              <input
                type="range"
                min="0.25"
                max="0.75"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                style={{ width: '90px', accentColor: 'var(--accent)' }}
              />
            </div>
            <button
              className="btn"
              onClick={runFaceMatch}
              disabled={matchingLoading}
            >
              <RefreshCw size={14} className={matchingLoading ? 'spin' : ''} />
              {matchingLoading ? 'Matching…' : 'Re-run Matching'}
            </button>
          </div>
        </div>

        {matchData.isLive ? (
          <div className="notice success">
            Connected to <strong>InsightFace (buffalo_l)</strong> on CPU. Scored against {matchData.totalCandidates || matchData.matches?.length} candidate image(s) with {matchData.positiveMatches || 0} match(es) above {threshold} similarity threshold.
          </div>
        ) : (
          <div className="notice warn">
            Simulated candidates only. A match similarity shows visual cosine resemblance.
          </div>
        )}

        {!referencePhoto && (
          <p className="muted small">
            No reference photo set. Currently using default test reference portrait. <button className="link" onClick={() => setPage('identity')}>Set photo in My Identity</button>.
          </p>
        )}

        <div className="stack" style={{ gap: '12px' }}>
          {matchData.matches.map((m) => (
            <div key={m.id} className={`match-card ${m.is_match ? 'is-match' : ''}`}>
              {m.image_url ? (
                <img className="match-thumb" src={m.image_url} alt={m.filename} />
              ) : (
                <div className="match-thumb" style={{ display: 'grid', placeItems: 'center', background: 'var(--surface-3)', fontSize: '12px', color: 'var(--muted)' }}>
                  Preview
                </div>
              )}
              <div className="stack grow" style={{ gap: '4px' }}>
                <div className="row between wrap">
                  <div style={{ fontWeight: 600 }}>{m.filename || m.reference}</div>
                  <div className="row gap">
                    <span className="muted small">{m.source}</span>
                    {m.is_match ? (
                      <span className="badge badge-high">Match Found</span>
                    ) : (
                      <span className="badge badge-open">No Match</span>
                    )}
                  </div>
                </div>

                <div className="row gap wrap" style={{ fontSize: '13px' }}>
                  <div className="row gap" style={{ minWidth: '150px' }}>
                    <span className="muted">Similarity:</span>
                    <strong style={{ color: m.is_match ? 'var(--high)' : 'var(--text)' }}>
                      {m.similarity}%
                    </strong>
                    <div className="progress" style={{ width: '60px', height: '6px' }}>
                      <div
                        className="progress-bar"
                        style={{
                          width: `${Math.min(100, m.similarity)}%`,
                          background: m.is_match ? 'var(--high)' : 'var(--muted)',
                        }}
                      />
                    </div>
                  </div>
                  {m.num_faces_detected !== undefined && (
                    <span className="muted">· {m.num_faces_detected} face(s) evaluated</span>
                  )}
                  {m.assessment && (
                    <span className="muted">· {m.assessment}</span>
                  )}
                </div>
              </div>

              <div>
                {reviews[m.id] ? (
                  <StatusBadge value={reviews[m.id]} />
                ) : (
                  <div className="row gap">
                    <button className="btn small" onClick={() => setReviews({ ...reviews, [m.id]: 'Confirmed' })}>
                      Confirm
                    </button>
                    <button className="btn small" onClick={() => setReviews({ ...reviews, [m.id]: 'Rejected' })}>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
