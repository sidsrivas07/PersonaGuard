import { Monitor, Sun, Moon } from 'lucide-react';
import { useApp } from '../context/AppContext';

const OPTIONS = [
  { key: 'system', label: 'System', icon: Monitor },
  { key: 'light', label: 'Light', icon: Sun },
  { key: 'dark', label: 'Dark', icon: Moon },
];

// Three-way switch. The real work (applying the theme) happens in AppContext.jsx.
// showLabels=false -> icons only (header); showLabels=true -> icons + words (Settings).
export default function ThemeToggle({ showLabels = false }) {
  const { theme, setTheme } = useApp();
  return (
    <div className="segmented" role="group" aria-label="Colour theme">
      {OPTIONS.map(({ key, label, icon: Icon }) => (
        <button key={key} type="button" title={label} aria-label={`${label} theme`} aria-pressed={theme === key}
          className={`seg ${theme === key ? 'active' : ''}`} onClick={() => setTheme(key)}>
          <Icon size={15} />{showLabels && <span>{label}</span>}
        </button>
      ))}
    </div>
  );
}
