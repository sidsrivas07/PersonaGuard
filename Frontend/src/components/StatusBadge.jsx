import { AlertOctagon, AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

const BADGE_ICONS = {
  Critical: AlertOctagon,
  High: AlertTriangle,
  Medium: AlertCircle,
  Low: Info,
  Resolved: CheckCircle2,
  Completed: CheckCircle2,
};

// Small coloured label. Used for severity (Critical/High/...) and status (Open/Resolved/...).
// Severity badges are always paired with both a text label AND a distinct icon
// so they never rely on color alone.
export default function StatusBadge({ value }) {
  if (!value) return null;
  const cls = value.toLowerCase().replace(/\s+/g, '-');
  const Icon = BADGE_ICONS[value];

  return (
    <span className={`badge badge-${cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {Icon && <Icon size={11} aria-hidden="true" />}
      <span>{value}</span>
    </span>
  );
}
