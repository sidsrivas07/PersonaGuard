import { LayoutDashboard, User, Radar, ListChecks, ShieldCheck, Bell, FileText, Settings, ShieldAlert, FileCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const NAV_ITEMS = [
  { key: 'dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { key: 'identity',    label: 'My Identity',  icon: User },
  { key: 'scans',       label: 'Scans',        icon: Radar },
  { key: 'findings',    label: 'Findings',     icon: ListChecks },
  { key: 'remediation', label: 'Remediation',  icon: ShieldCheck },
  { key: 'alerts',      label: 'Alerts',       icon: Bell },
  { key: 'reports',     label: 'Reports',      icon: FileText },
  { key: 'settings',    label: 'Settings',     icon: Settings },
];

export default function Sidebar({ open, onNavigate }) {
  const { page, unreadAlerts, openFindings, profile } = useApp();

  // Count unresolved findings that have no completed remediation
  const unresolvedCount = openFindings ? openFindings.length : 0;

  return (
    <nav className={`sidebar ${open ? 'open' : ''}`} aria-label="Main navigation">
      {/* Brand */}
      <div className="brand">
        <span className="brand-mark" aria-hidden="true"><ShieldAlert size={18} /></span>
        PersonaGuard
      </div>

      {/* Nav links */}
      <ul role="list">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <li key={key}>
            <button
              className={`nav-item ${page === key ? 'active' : ''}`}
              onClick={() => onNavigate(key)}
              aria-current={page === key ? 'page' : undefined}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
              {/* Alerts badge shows unread count */}
              {key === 'alerts' && unreadAlerts > 0 && (
                <span className="count" aria-label={`${unreadAlerts} unread alerts`}>{unreadAlerts}</span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {/* Consent receipt in footer */}
      <div className="consent-box">
        <div className="consent-row">
          <span className={`dot ${profile.consentGiven ? 'on' : 'off'}`} aria-hidden="true" />
          <span>{profile.consentGiven ? 'Consent active' : 'No consent on file'}</span>
        </div>
        {profile.consentGiven && (
          <div className="muted small" style={{ marginTop: 4 }}>
            Granted {profile.consentDate} &middot; Simulated
          </div>
        )}
        <div className="muted small" style={{ marginTop: 2 }}>
          No data leaves your browser.
        </div>
      </div>
    </nav>
  );
}
