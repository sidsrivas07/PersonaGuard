import { FlaskConical } from 'lucide-react';

// Reminder shown wherever data is simulated.
export default function DemoNotice({ children }) {
  return (
    <div className="notice">
      <FlaskConical size={16} />
      <span>{children || 'Demonstration data. Nothing here came from a real scan.'}</span>
    </div>
  );
}
