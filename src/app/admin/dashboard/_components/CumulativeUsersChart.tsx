'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const TICK_FILL = '#6b6b6b';
const GRID_STROKE = '#2a2a2a';
const LINE_STROKE = '#2cbb5d';

const RANGE_OPTIONS: { value: string; label: string }[] = [
  { value: '30d', label: '30 days' },
  { value: '90d', label: '3 months' },
  { value: '180d', label: '6 months' },
  { value: '365d', label: '1 year' },
  { value: 'all', label: 'All time' },
];

function formatLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function CumulativeUsersChart() {
  const [range, setRange] = useState('30d');
  const [series, setSeries] = useState<{ date: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSeries = useCallback(async (r: string) => {
    setLoading(true);
    const res = await fetch(`/api/admin/dashboard/cumulative-users?range=${r}`);
    if (!res.ok) {
      setSeries([]);
      setLoading(false);
      return;
    }
    const json: { series: { date: string; count: number }[] } = await res.json();
    setSeries(json.series ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSeries(range);
  }, [range, fetchSeries]);

  const chartData = series.map((d) => ({ ...d, label: formatLabel(d.date) }));

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-workbench/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-text-primary">Cumulative users</h3>
        <div className="flex flex-wrap gap-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRange(opt.value)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                range === opt.value
                  ? 'bg-[#2cbb5d]/20 text-[#2cbb5d]'
                  : 'text-text-muted hover:bg-surface-dense hover:text-text-secondary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 h-64">
        {loading ? (
          <div className="flex h-full items-center justify-center text-text-muted text-sm">
            Loading…
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-text-muted text-sm">
            No data
          </div>
        ) : (
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
                formatter={(value) => [value ?? 0, 'Users']}
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
        )}
      </div>
    </div>
  );
}
