import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ThemeToggle from '../components/ThemeToggle';

export default function Settings() {
  const { settings, setSettings, resetDemo } = useApp();
  const [confirming, setConfirming] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const doReset = () => { resetDemo(); setConfirming(false); setResetDone(true); setTimeout(() => setResetDone(false), 3000); };

  return (
    <div className="stack">
      <div className="card stack">
        <h3>Appearance</h3>
        <ThemeToggle showLabels />
        <p className="muted small">System follows your laptop or phone setting and switches with it. Your choice is saved in this browser.</p>
      </div>

      <div className="card stack">
        <h3>Preferences</h3>
        <label className="check"><input type="checkbox" checked={settings.emailAlerts} onChange={(e) => setSettings({ ...settings, emailAlerts: e.target.checked })} />E-mail me about new exposure (preference only; no e-mails are sent in this demo)</label>
        <label className="field narrow"><span>Re-scan reminder</span>
          <select value={settings.scanReminder} onChange={(e) => setSettings({ ...settings, scanReminder: e.target.value })}>
            <option>Weekly</option><option>Every 2 weeks</option><option>Monthly</option><option>Off</option>
          </select>
        </label>
      </div>

      <div className="card stack">
        <h3>Consent and privacy</h3>
        <p>PersonaGuard is designed for self-audit. You should only enter your own details, and scans should only use sources that permit access.</p>
        <p className="muted">In this demo, consent is a toggle stored in your browser. A full version would keep a consent log on a server, which does not exist yet.</p>
      </div>

      <div className="card stack">
        <h3>Data retention</h3>
        <p>All demonstration data is kept in your browser's local storage on this device. Nothing is sent to a server. The reference photo is held in memory only and is gone when you refresh.</p>
        <p className="muted">Account deletion and server-side data erasure are planned for the future backend and are not available in this version.</p>
      </div>

      <div className="card stack">
        <h3>Reset demonstration data</h3>
        <p className="muted">Restores the sample findings, actions, alerts, scans, profile and preferences.</p>
        {resetDone && <div className="notice success">Demonstration data was reset.</div>}
        {!confirming
          ? <button className="btn" onClick={() => setConfirming(true)}><RotateCcw size={14} />Reset demonstration data</button>
          : <div className="row gap"><span>Reset everything?</span><button className="btn primary" onClick={doReset}>Yes, reset</button><button className="btn" onClick={() => setConfirming(false)}>Cancel</button></div>}
      </div>
    </div>
  );
}
