// Ring gauge for the 0-100 exposure score. Lower is safer.
function describe(score) {
  if (score <= 30) return { label: 'Low exposure', color: 'var(--low)' };
  if (score <= 55) return { label: 'Moderate exposure', color: 'var(--medium)' };
  if (score <= 75) return { label: 'Elevated exposure', color: 'var(--accent)' };
  return { label: 'High exposure', color: 'var(--critical)' };
}

export default function ExposureScore({ score }) {
  const { label, color } = describe(score);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference; // how much of the ring to colour
  return (
    <div className="card score-card">
      <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label={`Exposure score ${score} out of 100`}>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--surface-3)" strokeWidth="12" />
        <circle cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`} transform="rotate(-90 70 70)" style={{ transition: 'stroke-dasharray .6s' }} />
        <text x="70" y="72" textAnchor="middle" className="score-number" fill="var(--text)">{score}</text>
        <text x="70" y="94" textAnchor="middle" fill="var(--muted)" fontSize="12">out of 100</text>
      </svg>
      <div>
        <h3>{label}</h3>
        <p className="muted">
          The exposure score combines the severity of your open findings into one number.
          Lower is safer. It drops as you complete remediation actions.
        </p>
        <p className="muted small">This score is separate from any face-match similarity.</p>
      </div>
    </div>
  );
}
