'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DailyLineChartProps {
  data: { date: string; count: number }[];
  title: string;
}

const TICK_FILL = '#6b6b6b';
const GRID_STROKE = '#2a2a2a';
const LINE_STROKE = '#2cbb5d';

function formatLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function DailyLineChart({ data, title }: DailyLineChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatLabel(d.date),
  }));

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-workbench/60 p-4">
      <h3 className="text-sm font-medium text-text-primary">{title}</h3>
      <div className="mt-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 32 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatLabel}
              tick={{ fill: TICK_FILL, fontSize: 11 }}
              angle={-90}
              textAnchor="end"
              axisLine={{ stroke: GRID_STROKE }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              dataKey="count"
              tick={{ fill: TICK_FILL, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#141414',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#a1a1a1' }}
              labelFormatter={(label) => (typeof label === 'string' ? formatLabel(label) : String(label))}
              formatter={(value) => [value ?? 0, 'Count']}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke={LINE_STROKE}
              strokeWidth={2}
              dot={{ fill: LINE_STROKE, r: 2 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
