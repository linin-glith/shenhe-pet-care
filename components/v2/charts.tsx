'use client';

/**
 * The console's charts, drawn as plain SVG.
 *
 * WHY NO CHART LIBRARY
 * A charting library is several hundred kilobytes of JavaScript for a line
 * and a pie. The site is a static export served by nginx, and the console
 * opens on a machine that may be running a browser on the factory floor. SVG
 * is drawn by the browser itself, scales to any screen, costs nothing to
 * download, and cannot break when a version changes.
 *
 * WHY THE SCALE IS FIXED AT ZERO
 * A line chart whose axis starts at a non-zero minimum exaggerates small
 * changes. Every chart here starts at zero, and a flat line is drawn as a
 * flat line rather than a dramatic peak.
 *
 * WHAT THE COLOURS ARE
 * The site palette: deep ink for the ground, teal for the accent, and a small
 * set of hues for the categories. Each series in a chart is a different
 * colour so the legend is readable without hovering.
 */

import { useId } from 'react';

export type Series = {
  key: string;
  label: string;
  color: string;
  /** One value per label. The chart draws them in order. */
  points: number[];
};

/* ------------------------------------------------------------------ */
/* Line chart                                                          */
/* ------------------------------------------------------------------ */

export function LineChart({
  series,
  labels,
  height = 180,
  width = 640,
  formatValue,
}: {
  series: Series[];
  labels: string[];
  height?: number;
  width?: number;
  formatValue?: (n: number) => string;
}) {
  const id = useId();
  const pad = { top: 12, right: 12, bottom: 26, left: 38 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  // The scale is the largest total across all series on any one day, so the
  // lines are comparable and the zero line means zero.
  const totals = labels.map((_, i) =>
    series.reduce((sum, s) => sum + (s.points?.[i] ?? 0), 0),
  );
  const max = Math.max(1, ...totals);
  const niceMax = niceCeil(max);

  const n = Math.max(labels.length, 1);
  const x = (i: number) => pad.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - (v / niceMax) * innerH;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    v: niceMax * f,
    y: y(niceMax * f),
  }));

  // Every fifth label, so the axis is readable rather than crowded.
  const labelEvery = Math.max(1, Math.ceil(n / 8));

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img"
           aria-label={`Chart of ${series.map((s) => s.label).join(', ')}`}>
        <defs>
          <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={series[0]?.color ?? '#0f766e'} stopOpacity="0.18" />
            <stop offset="100%" stopColor={series[0]?.color ?? '#0f766e'} stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridLines.map((g, i) => (
          <g key={i}>
            <line
              x1={pad.left} y1={g.y} x2={width - pad.right} y2={g.y}
              stroke="currentColor" strokeOpacity="0.08" strokeWidth="1"
            />
            <text
              x={pad.left - 8} y={g.y + 4}
              textAnchor="end"
              className="fill-current text-[10px]"
              style={{ opacity: 0.45 }}
            >
              {formatValue ? formatValue(Math.round(g.v)) : Math.round(g.v)}
            </text>
          </g>
        ))}

        {series.map((s) => {
          const pts = (s.points ?? []).map((v, i) => `${x(i)},${y(v)}`).join(' ');
          const area = `${pad.left},${y(0)} ${pts} ${x(n - 1)},${y(0)}`;
          return (
            <g key={s.key}>
              {s.key === series[0].key && (
                <polygon points={area} fill={`url(#fill-${id})`} />
              )}
              <polyline
                points={pts}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {s.points?.map((v, i) =>
                v > 0 ? (
                  <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill={s.color} />
                ) : null,
              )}
            </g>
          );
        })}

        {labels.map((l, i) =>
          i % labelEvery === 0 ? (
            <text
              key={i}
              x={x(i)}
              y={height - 8}
              textAnchor="middle"
              className="fill-current text-[10px]"
              style={{ opacity: 0.45 }}
            >
              {l}
            </text>
          ) : null,
        )}
      </svg>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-xs text-v2-ink-600">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} aria-hidden />
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bar chart (vertical)                                                */
/* ------------------------------------------------------------------ */

export function BarChart({
  data,
  height = 200,
  width = 640,
  color = '#0f766e',
}: {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  width?: number;
  color?: string;
}) {
  const pad = { top: 12, right: 8, bottom: 40, left: 38 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(1, ...data.map((d) => d.value));
  const niceMax = niceCeil(max);
  const n = Math.max(data.length, 1);
  const slot = innerW / n;
  const barW = Math.max(4, Math.min(38, slot * 0.62));

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img"
           aria-label="Bar chart">
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
          <g key={i}>
            <line
              x1={pad.left} y1={pad.top + innerH - niceMax * f * (innerH / niceMax)}
              x2={width - pad.right} y2={pad.top + innerH - niceMax * f * (innerH / niceMax)}
              stroke="currentColor" strokeOpacity="0.08" strokeWidth="1"
            />
            <text
              x={pad.left - 8} y={pad.top + innerH - niceMax * f * (innerH / niceMax) + 4}
              textAnchor="end" className="fill-current text-[10px]" style={{ opacity: 0.45 }}
            >
              {Math.round(niceMax * f)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const h = (d.value / niceMax) * innerH;
          const cx = pad.left + slot * i + slot / 2;
          return (
            <g key={d.label + i}>
              <rect
                x={cx - barW / 2}
                y={pad.top + innerH - h}
                width={barW}
                height={Math.max(d.value > 0 ? 2 : 0, h)}
                rx="3"
                fill={d.color ?? color}
                opacity={d.value > 0 ? 0.9 : 0.12}
              />
              {d.value > 0 && (
                <text
                  x={cx} y={pad.top + innerH - h - 5}
                  textAnchor="middle" className="fill-current text-[10px] font-semibold"
                  style={{ opacity: 0.7 }}
                >
                  {d.value}
                </text>
              )}
              <text
                x={cx} y={height - 22}
                textAnchor="middle" className="fill-current text-[10px]"
                style={{ opacity: 0.45 }}
              >
                {d.label.length > 7 ? d.label.slice(0, 6) + '…' : d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Donut                                                               */
/* ------------------------------------------------------------------ */

export function Donut({
  data,
  size = 190,
  thickness = 26,
  centerLabel,
  centerValue,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string | number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img"
           aria-label="Distribution chart">
        <circle
          cx={c} cy={c} r={r}
          fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth={thickness}
        />
        {total > 0 &&
          data.map((d) => {
            const len = (d.value / total) * circumference;
            const el = (
              <circle
                key={d.label}
                cx={c} cy={c} r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                strokeDasharray={`${len} ${circumference - len}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${c} ${c})`}
              />
            );
            offset += len;
            return el;
          })}
        {centerValue !== undefined && (
          <>
            <text x={c} y={c - 2} textAnchor="middle"
                  className="fill-current text-2xl font-semibold">{centerValue}</text>
            <text x={c} y={c + 16} textAnchor="middle"
                  className="fill-current text-[10px]" style={{ opacity: 0.5 }}>
              {centerLabel ?? ''}
            </text>
          </>
        )}
      </svg>

      <ul className="space-y-2">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-3 text-sm">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} aria-hidden />
            <span className="text-v2-ink-700">{d.label}</span>
            <span className="ml-auto tabular-nums font-semibold text-v2-ink-900">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* A round number to a readable maximum                                */
/* ------------------------------------------------------------------ */

function niceCeil(v: number): number {
  if (v <= 5) return 5;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * mag;
}
