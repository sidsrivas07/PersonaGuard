import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Line chart of the exposure score over past scans. Lower is safer.
export default function ExposureTrendChart({ data }) {
  return (
    <div className="card">
      <h3>Exposure score over time</h3>
      <p className="muted small">Lower is safer. The last point is your current score.</p>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" stroke="var(--muted)" tickLine={false} fontSize={12} />
            <YAxis domain={[40, 100]} stroke="var(--muted)" tickLine={false} fontSize={12} />
            <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8 }} labelStyle={{ color: 'var(--muted)' }} />
            <Line type="monotone" dataKey="score" name="Score" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent)' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
