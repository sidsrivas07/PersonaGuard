// Ring gauge for the 0-100 exposure score. Lower is safer.
// Exposure gauge color follows the score band, NOT the brand color:
// Low = teal, Moderate = yellow, Elevated = orange, Severe = red.
function describe(score) {
  if (score <= 30) return { label: 'Low',      gaugeColor: 'var(--gauge-low)' };
  if (score <= 55) return { label: 'Moderate', gaugeColor: 'var(--gauge-moderate)' };
  if (score <= 75) return { label: 'Elevated', gaugeColor: 'var(--gauge-elevated)' };
  return           { label: 'Severe',   gaugeColor: 'var(--gauge-severe)' };
}

// Previous scan score for delta calculation (Scan 4 score from TREND_HISTORY)
const PREV_SCORE = 70;

export default function ExposureScore({ score }) {
  const { label, gaugeColor } = describe(score);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;

  const delta = score - PREV_SCORE;
  const deltaSign = delta < 0 ? '↓' : delta > 0 ? '↑' : '—';
  const deltaColor = delta < 0 ? 'var(--success)' : delta > 0 ? 'var(--critical)' : 'var(--muted)';
  const deltaLabel = delta === 0
    ? 'unchanged from last scan'
    : `${Math.abs(delta)} pts ${delta < 0 ? 'lower' : 'higher'} than last scan`;

  return (
    <div className="hero-card score-gauge-card">
      <svg
        width="160" height="160" viewBox="0 0 160 160"
        role="img"
        aria-label={`Exposure score: ${score} out of 100. Risk level: ${label}. ${deltaLabel}.`}
      >
        {/* Track = border color */}
        <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--gauge-track)" strokeWidth="13" />
        {/* Arc */}
        <circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke={gaugeColor}
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          transform="rotate(-90 80 80)"
          style={{ transition: 'stroke-dasharray .6s ease, stroke .3s' }}
        />
        {/* Score number */}
        <text x="80" y="78" textAnchor="middle" className="score-number" fill="var(--text-heading)" fontSize="36" fontWeight="700">{score}</text>
        <text x="80" y="102" textAnchor="middle" fill="var(--muted)" fontSize="12">out of 100</text>
      </svg>

      <div className="score-meta">
        {/* Risk label coloured by score band severity */}
        <div className="score-label" style={{ color: gaugeColor }}>
          {label} risk
        </div>

        {/* Delta vs last scan */}
        <div className="score-delta" style={{ color: deltaColor }} aria-label={deltaLabel}>
          {deltaSign} {Math.abs(delta)} vs last scan
        </div>

        <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
          Severity-weighted score across all open findings.
          Lower is safer — it falls as you resolve items.
        </p>
      </div>
    </div>
  );
}
