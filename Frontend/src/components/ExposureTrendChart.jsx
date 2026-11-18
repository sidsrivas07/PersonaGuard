import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Line chart of the exposure score over past scans. Lower is safer.
// Uses brand blue line with highlighted current (latest) point.
export default function ExposureTrendChart({ data }) {
  const lastIndex = (data && data.length > 0) ? data.length - 1 : -1;

  return (
    <div className="card" role="region" aria-label="Exposure score trend">
      <h3>Exposure score over time</h3>
      <p className="muted small">Lower is safer. The last point is your current score.</p>
      <div style={{ width: '100%', height: 220 }} role="img" aria-label="Exposure score over time chart">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" stroke="var(--muted)" tickLine={false} fontSize={12} />
            <YAxis domain={[40, 100]} stroke="var(--muted)" tickLine={false} fontSize={12} />
            <Tooltip
              contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8 }}
              labelStyle={{ color: 'var(--muted)' }}
              itemStyle={{ color: 'var(--text)' }}
            />
            <Line
              type="monotone"
              dataKey="score"
              name="Score"
              stroke="var(--accent)"
              strokeWidth={3}
              dot={(props) => {
                const isLast = props.index === lastIndex;
                return (
                  <circle
                    key={`dot-${props.index}`}
                    cx={props.cx}
                    cy={props.cy}
                    r={isLast ? 6 : 4}
                    fill="var(--accent)"
                    stroke={isLast ? 'var(--surface)' : 'none'}
                    strokeWidth={isLast ? 2 : 0}
                  />
                );
              }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
