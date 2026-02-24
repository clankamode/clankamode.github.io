"use client";

import React, { useMemo, useState } from 'react';

interface ActivityHeatmapProps {
  completionDates: string[];
  weeks?: number;
}

interface HeatmapDay {
  dateKey: string;
  dateLabel: string;
  shortDateLabel: string;
  count: number;
  level: number;
}

const BRAND_GREEN = '#2cbb5d';

const INTENSITY_STYLES: React.CSSProperties[] = [
  {},
  { backgroundColor: `${BRAND_GREEN}33` }, // 20% opacity
  { backgroundColor: `${BRAND_GREEN}66` }, // 40% opacity
  { backgroundColor: `${BRAND_GREEN}aa` }, // 67% opacity
  { backgroundColor: BRAND_GREEN },
];

function getLocalDateKey(date: Date) {
  return date.toLocaleDateString('en-CA');
}

function getStartOfWeekMonday(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dayOffset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dayOffset);
  return d;
}

function getCompletionLabel(count: number) {
  return count === 1 ? '1 completion' : `${count} completions`;
}

export default function ActivityHeatmap({ completionDates, weeks = 26 }: ActivityHeatmapProps) {
  const [activeDateKey, setActiveDateKey] = useState<string | null>(null);

  // Build week columns: array of 26 weeks, each with 7 days (Mon–Sun)
  const weekColumns = useMemo<HeatmapDay[][]>(() => {
    const countByDate = new Map<string, number>();
    for (const iso of completionDates) {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) continue;
      const key = getLocalDateKey(d);
      countByDate.set(key, (countByDate.get(key) ?? 0) + 1);
    }

    const currentWeekStart = getStartOfWeekMonday(new Date());
    const firstDate = new Date(currentWeekStart);
    firstDate.setDate(firstDate.getDate() - (weeks - 1) * 7);

    const columns: HeatmapDay[][] = [];

    for (let w = 0; w < weeks; w++) {
      const col: HeatmapDay[] = [];
      for (let d = 0; d < 7; d++) {
        const day = new Date(firstDate);
        day.setDate(firstDate.getDate() + w * 7 + d);
        const dateKey = getLocalDateKey(day);
        const count = countByDate.get(dateKey) ?? 0;
        col.push({
          dateKey,
          dateLabel: day.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          shortDateLabel: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count,
          level: Math.min(count, 4),
        });
      }
      columns.push(col);
    }

    return columns;
  }, [completionDates, weeks]);

  const activeDay = weekColumns.flat().find((d) => d.dateKey === activeDateKey) ?? null;

  return (
    <div className="space-y-3">
      {/* Tooltip */}
      <div className="h-5">
        {activeDay ? (
          <span className="text-xs text-text-secondary">
            {activeDay.shortDateLabel} · {getCompletionLabel(activeDay.count)}
          </span>
        ) : (
          <span className="text-xs text-text-muted">Hover a cell to see details</span>
        )}
      </div>

      {/* Grid: explicit flex row of week-columns */}
      <div className="overflow-x-auto">
        <div role="grid" className="flex gap-[3px]">
          {weekColumns.map((col, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {col.map((day) => (
                <button
                  key={day.dateKey}
                  type="button"
                  role="gridcell"
                  data-testid="activity-cell"
                  data-date={day.dateKey}
                  data-count={day.count}
                  data-level={day.level}
                  aria-label={`${day.dateLabel} · ${getCompletionLabel(day.count)}`}
                  title={`${day.shortDateLabel} · ${getCompletionLabel(day.count)}`}
                  className={`h-3 w-3 rounded-sm transition-colors focus:outline-none focus:ring-1 focus:ring-border-interactive ${day.level === 0 ? 'bg-surface-dense' : ''}`}
                  style={day.level > 0 ? INTENSITY_STYLES[day.level] : undefined}
                  onMouseEnter={() => setActiveDateKey(day.dateKey)}
                  onFocus={() => setActiveDateKey(day.dateKey)}
                  onMouseLeave={() => setActiveDateKey(null)}
                  onBlur={() => setActiveDateKey(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span>Less</span>
        <div className="flex items-center gap-[3px]">
          {INTENSITY_STYLES.map((style, i) => (
            <span
              key={i}
              className={`h-3 w-3 rounded-sm ${i === 0 ? 'bg-surface-dense' : ''}`}
              style={i > 0 ? style : undefined}
            />
          ))}
        </div>
        <span>More</span>
      </div>

      {/* Empty state */}
      {!completionDates.length && (
        <p className="text-sm text-text-secondary">Complete articles to start building your streak.</p>
      )}
    </div>
  );
}
