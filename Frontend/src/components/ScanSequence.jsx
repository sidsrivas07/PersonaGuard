import { CheckCircle2, AlertTriangle, Loader2, Circle, ArrowRight } from 'lucide-react';
import { SOURCES } from '../data/mockData';
import { SOURCE_FINDINGS_COUNT } from '../services/scanService';

// 6-source scan checklist UI with real-time progressive states
// Displays each source going from idle -> scanning -> done (with findings count)
export default function ScanSequence({ scanState, onDismiss, onViewFindings }) {
  const isScanning = scanState.status === 'scanning';
  const isCompleted = scanState.status === 'completed';
  const isFailed = scanState.status === 'failed';

  if (!isScanning && !isCompleted && !isFailed) return null;

  const totalDiscovered = SOURCES.reduce((sum, s, idx) => {
    if (idx < scanState.completedIndex || isCompleted) {
      return sum + (SOURCE_FINDINGS_COUNT[s] || 0);
    }
    return sum;
  }, 0);

  return (
    <div className="card scan-sequence" role="region" aria-live="polite" aria-label="Scan sequence">
      {/* Top progress header */}
      <div className="row between wrap scan-seq-header">
        <div>
          <h4>
            {isScanning && 'Live audit in progress...'}
            {isCompleted && 'Audit scan completed'}
            {isFailed && 'Scan encountered an issue'}
          </h4>
          <p className="muted small" style={{ marginTop: 2 }}>
            {isScanning && `Evaluating source ${Math.min(scanState.completedIndex + 1, SOURCES.length)} of ${SOURCES.length} · ${totalDiscovered} findings detected`}
            {isCompleted && `Evaluated all ${SOURCES.length} sources · 27 findings verified`}
            {isFailed && (scanState.error || 'Scan interrupted')}
          </p>
        </div>
        <div className="row gap">
          <span className="scan-percent tabular">{scanState.progress}%</span>
          {isCompleted && onViewFindings && (
            <button className="btn btn-sm primary" onClick={onViewFindings}>
              View findings <ArrowRight size={13} aria-hidden="true" />
            </button>
          )}
          {(isCompleted || isFailed) && onDismiss && (
            <button className="btn btn-sm" onClick={onDismiss} aria-label="Dismiss scan sequence">
              Dismiss
            </button>
          )}
        </div>
      </div>

      {/* Thin top progress bar */}
      <div className="progress" style={{ height: 4, margin: '10px 0 14px' }}>
        <div
          className="progress-bar"
          style={{
            width: `${scanState.progress}%`,
            background: isFailed ? 'var(--critical)' : isCompleted ? 'var(--success)' : 'var(--accent)',
            transition: 'width 0.4s ease-out',
          }}
        />
      </div>

      {/* 6-Source checklist */}
      <ul className="scan-source-list" role="list">
        {SOURCES.map((source, index) => {
          const isDone = isCompleted || index < scanState.completedIndex;
          const isCurrent = isScanning && index === scanState.completedIndex;
          const isCurrentFailed = isFailed && index === scanState.completedIndex;
          const count = SOURCE_FINDINGS_COUNT[source] || 0;

          return (
            <li
              key={source}
              className={`scan-source-item ${isDone ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''} ${isCurrentFailed ? 'is-failed' : ''}`}
            >
              <div className="row gap" style={{ flex: 1, minWidth: 0 }}>
                {/* Status icon */}
                <span className="source-icon" aria-hidden="true">
                  {isDone && <CheckCircle2 size={16} color="var(--success)" />}
                  {isCurrent && <Loader2 size={16} className="spin-icon" color="var(--accent)" />}
                  {isCurrentFailed && <AlertTriangle size={16} color="var(--critical)" />}
                  {!isDone && !isCurrent && !isCurrentFailed && <Circle size={14} color="var(--muted)" opacity={0.4} />}
                </span>

                <span className="source-name">{source}</span>
              </div>

              {/* Status pill / finding count */}
              <div className="source-meta">
                {isDone && (
                  <span className="badge badge-resolved tabular">
                    +{count} finding{count !== 1 ? 's' : ''}
                  </span>
                )}
                {isCurrent && (
                  <span className="badge badge-scanning">
                    Scanning...
                  </span>
                )}
                {isCurrentFailed && (
                  <span className="badge badge-failed">
                    Timed out
                  </span>
                )}
                {!isDone && !isCurrent && !isCurrentFailed && (
                  <span className="muted small tabular">
                    Queued
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
