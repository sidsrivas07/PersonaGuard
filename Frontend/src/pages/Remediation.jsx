import { useState } from 'react';
import { Check, ChevronDown, Copy, CheckCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import DemoNotice from '../components/DemoNotice';

export default function Remediation() {
  const { remediation, toggleRemediation, exposureScore } = useApp();
  const [openId, setOpenId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const done = remediation.filter((a) => a.status === 'Completed').length;

  const copy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="stack">
      <DemoNotice>
        Actionable privacy playbooks. Step-by-step guidance to remove exposed data, revoke permissions, and request broker opt-outs.
      </DemoNotice>

      <div className="card row between wrap">
        <div>
          <h3>{done} of {remediation.length} actions complete</h3>
          <p className="muted" style={{ marginTop: 2 }}>
            Current exposure score: <strong className="tabular">{exposureScore}</strong>/100
          </p>
        </div>
        <div className="progress wide" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={remediation.length}>
          <div className="progress-bar" style={{ width: `${(done / remediation.length) * 100}%` }} />
        </div>
      </div>

      {remediation.map((a) => {
        const isDone = a.status === 'Completed';
        const isCopied = copiedId === a.id;

        return (
          <div className={`card action ${isDone ? 'done' : ''}`} key={a.id}>
            <div className="row between wrap">
              <div>
                <strong>{a.title}</strong>
                <p className="muted" style={{ marginTop: 2 }}>{a.description}</p>
              </div>
              <div className="row gap">
                <StatusBadge value={a.priority} />
                <StatusBadge value={a.status} />
              </div>
            </div>

            <div className="row gap wrap">
              <button
                className={`btn ${isDone ? '' : 'primary'}`}
                onClick={() => toggleRemediation(a.id)}
                aria-label={isDone ? `Reopen action: ${a.title}` : `Complete action: ${a.title}`}
              >
                <Check size={14} aria-hidden="true" />
                {isDone ? 'Mark as pending' : 'Mark complete'}
              </button>
              <button
                className="btn"
                onClick={() => setOpenId(openId === a.id ? null : a.id)}
                aria-expanded={openId === a.id}
                aria-label={openId === a.id ? `Hide steps for ${a.title}` : `Show steps for ${a.title}`}
              >
                <ChevronDown size={14} aria-hidden="true" />
                {openId === a.id ? 'Hide steps' : 'Show steps'}
              </button>
              <span className="badge badge-low tabular">
                Reduces score by {a.impact} pts
              </span>
            </div>

            {openId === a.id && (
              <div className="steps">
                <ol>{a.steps.map((s) => <li key={s}>{s}</li>)}</ol>
                {a.template && (
                  <>
                    <pre className="template" tabIndex={0} aria-label="Takedown request template">
                      {a.template}
                    </pre>
                    <button
                      className="btn btn-sm"
                      onClick={() => copy(a.id, a.template)}
                      aria-label="Copy request template"
                    >
                      {isCopied ? <CheckCheck size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                      {isCopied ? 'Copied to clipboard' : 'Copy template'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
