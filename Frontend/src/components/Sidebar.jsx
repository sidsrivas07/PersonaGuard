import { LayoutDashboard, User, Radar, ListChecks, ShieldCheck, Bell, FileText, Settings, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';

// Each nav item has a `key` (matches App.jsx's page map), a label and an icon.
export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'identity', label: 'My Identity', icon: User },
  { key: 'scans', label: 'Scans', icon: Radar },
  { key: 'findings', label: 'Findings', icon: ListChecks },
  { key: 'remediation', label: 'Remediation', icon: ShieldCheck },
  { key: 'alerts', label: 'Alerts', icon: Bell },
  { key: 'reports', label: 'Reports', icon: FileText },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ open, onNavigate }) {
  const { page, unreadAlerts, profile } = useApp();
  return (
    <nav className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand"><span className="brand-mark"><ShieldAlert size={18} /></span>PersonaGuard</div>
      <ul>
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <li key={key}>
            <button className={`nav-item ${page === key ? 'active' : ''}`} onClick={() => onNavigate(key)}>
              <Icon size={18} /><span>{label}</span>
              {key === 'alerts' && unreadAlerts > 0 && <span className="count">{unreadAlerts}</span>}
            </button>
          </li>
        ))}
      </ul>
      {/* Consent status is always visible, as in the project's UI principles. */}
      <div className="consent-box">
        <span className={`dot ${profile.consentGiven ? 'on' : 'off'}`} />
        {profile.consentGiven ? 'Demo consent active' : 'Consent not given'}
        <div className="muted small">Simulated. No consent record is stored on a server.</div>
      </div>
    </nav>
  );
}
