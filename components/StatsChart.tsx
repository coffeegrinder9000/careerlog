'use client';

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  applied: '#3b82f6',
  interview: '#f59e0b',
  offer: '#10b981',
  rejected: '#ef4444',
};

export default function StatsChart({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  if (chartData.length === 0) {
    return (
      <div className="mb-8 p-4 bg-gray-50 rounded-xl border text-center text-gray-500">
        Add your first application to see stats here.
      </div>
    );
  }

  return (
    <div className="mb-8 bg-white border rounded p-4">
      <h2 className="font-semibold mb-2 text-black">Application Breakdown</h2>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={90}
            dataKey="value"
            label={({ name, percent }) =>
              `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
            }
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={STATUS_COLORS[entry.name] ?? '#9ca3af'}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [value, 'Applications']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}