import { Bell, CheckCheck, ShieldAlert, Radar, CalendarClock, FilePlus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import DemoNotice from '../components/DemoNotice';

const ICONS = { 'new-finding': FilePlus, 'scan-complete': Radar, 'high-severity': ShieldAlert, reminder: CalendarClock };

export default function Alerts() {
  const { alerts, markAlertRead, markAllAlertsRead, unreadAlerts } = useApp();
  return (
    <div className="stack">
      <DemoNotice>Simulated notifications. No e-mail or push message is sent.</DemoNotice>
      <div className="row between">
        <p className="muted">{unreadAlerts} unread</p>
        <button className="btn" disabled={unreadAlerts === 0} onClick={markAllAlertsRead}><CheckCheck size={14} />Mark all as read</button>
      </div>
      {alerts.length === 0 && (
        <div className="empty" role="status">
          <Bell size={24} style={{ color: 'var(--muted)', margin: '0 auto 8px' }} aria-hidden="true" />
          <strong>All caught up</strong>
          <p className="muted" style={{ marginTop: 4 }}>No notifications at this time. Running a scan will surface new alerts.</p>
        </div>
      )}
      {alerts.map((a) => {
        const Icon = ICONS[a.type] || Bell;
        return (
          <div className={`card alert ${a.read ? 'read' : 'unread'} ${a.type}`} key={a.id}>
            <span className="alert-icon" aria-hidden="true"><Icon size={18} /></span>
            <div className="grow">
              <strong>{a.title}</strong>
              <div className="muted">{a.message}</div>
              <div className="muted small tabular">{a.time}</div>
            </div>
            <button
              className="btn btn-sm"
              onClick={() => markAlertRead(a.id, !a.read)}
              aria-label={a.read ? `Mark ${a.title} as unread` : `Mark ${a.title} as read`}
            >
              {a.read ? 'Mark unread' : 'Mark read'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
