import { FlaskConical, X } from 'lucide-react';
import { useState } from 'react';

// Thin dismissible demo banner. Accepts the data-driven text as children.
export default function DemoNotice({ children }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="demo-banner" role="status">
      <FlaskConical size={14} aria-hidden="true" />
      <span>{children || 'Demonstration data. Nothing here came from a real scan.'}</span>
      <button
        className="demo-banner-close"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss demonstration notice"
      >
        <X size={14} />
      </button>
    </div>
  );
}
