import { useState } from 'react';
import { Check, ChevronDown, Copy } from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import DemoNotice from '../components/DemoNotice';

export default function Remediation() {
  const { remediation, toggleRemediation, exposureScore } = useApp();
  const [openId, setOpenId] = useState(null);
  const [copied, setCopied] = useState(false);
  const done = remediation.filter((a) => a.status === 'Completed').length;

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ }
  };

  return (
    <div className="stack">
      <DemoNotice>You make the changes yourself. Marking an action complete only updates this demo. PersonaGuard never changes your accounts or sends takedown requests.</DemoNotice>
      <div className="card row between wrap">
        <div><h3>{done} of {remediation.length} actions complete</h3><p className="muted">Current exposure score: <strong>{exposureScore}</strong>/100</p></div>
        <div className="progress wide"><div className="progress-bar" style={{ width: `${(done / remediation.length) * 100}%` }} /></div>
      </div>

      {remediation.map((a) => {
        const isDone = a.status === 'Completed';
        return (
          <div className={`card action ${isDone ? 'done' : ''}`} key={a.id}>
            <div className="row between wrap">
              <div>
                <strong>{a.title}</strong>
                <p className="muted">{a.description}</p>
              </div>
              <div className="row gap">
                <StatusBadge value={a.priority} /><StatusBadge value={a.status} />
              </div>
            </div>
            <div className="row gap wrap">
              <button className={`btn ${isDone ? '' : 'primary'}`} onClick={() => toggleRemediation(a.id)}>
                <Check size={14} />{isDone ? 'Mark as pending' : 'Mark complete'}
              </button>
              <button className="btn" onClick={() => setOpenId(openId === a.id ? null : a.id)} aria-expanded={openId === a.id}>
                <ChevronDown size={14} />{openId === a.id ? 'Hide steps' : 'Show steps'}
              </button>
              <span className="muted small">Lowers score by {a.impact} when complete</span>
            </div>
            {openId === a.id && (
              <div className="steps">
                <ol>{a.steps.map((s) => <li key={s}>{s}</li>)}</ol>
                {a.template && (
                  <>
                    <pre className="template">{a.template}</pre>
                    <button className="btn" onClick={() => copy(a.template)}><Copy size={14} />{copied ? 'Copied' : 'Copy template'}</button>
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
