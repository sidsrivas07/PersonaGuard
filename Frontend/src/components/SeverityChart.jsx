import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = { Critical: 'var(--critical)', High: 'var(--high)', Medium: 'var(--medium)', Low: 'var(--low)' };

// Donut chart. `data` looks like [{ name: 'Critical', value: 4 }, ...]
export default function SeverityChart({ data }) {
  return (
    <div className="card" role="region" aria-label="Open findings by severity">
      <h3>Open findings by severity</h3>
      <div className="chart-row">
        <div style={{ width: 180, height: 180 }} role="img" aria-label="Severity distribution donut chart">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="none">
                {data.map((d) => <Cell key={d.name} fill={COLORS[d.name]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8 }} itemStyle={{ color: 'var(--text)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="legend">
          {data.map((d) => (
            <li key={d.name}><span className="dot" style={{ background: COLORS[d.name] }} />{d.name}<strong>{d.value}</strong></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
