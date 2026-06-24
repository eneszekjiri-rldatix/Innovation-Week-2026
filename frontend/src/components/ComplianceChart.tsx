import { useState, useCallback, useRef } from 'react';
import type { ChartDataPoint } from '../types/alerts';

interface ComplianceChartProps {
  data: ChartDataPoint[];
  thresholdPercent?: number;
}

const METRICS: {
  key: keyof Omit<ChartDataPoint, 'day'>;
  label: string;
  color: string;
  strokeWidth: number;
}[] = [
  { key: 'rubDuration',    label: 'Rub Duration',      color: '#3870F2', strokeWidth: 2.5 },
  { key: 'numberOfEvents', label: 'Number of Events',  color: '#0FAB85', strokeWidth: 1.5 },
  { key: 'bareElbows',     label: 'Bare Below Elbows', color: '#8C59F7', strokeWidth: 1.5 },
  { key: 'poorHandDrying', label: 'Poor Hand Drying',  color: '#E0850F', strokeWidth: 1.5 },
];

const Y_TICKS = [100, 95, 90, 85, 80, 75, 70, 65, 60];
const X_TICKS = [1, 5, 10, 15, 20, 25, 30];

const M = { top: 10, right: 14, bottom: 28, left: 38 };
const VW = 680;
const VH = 268;
const PW = VW - M.left - M.right;
const PH = VH - M.top - M.bottom;

const Y_MIN = 60;
const Y_MAX = 100;
const X_MIN = 1;
const X_MAX = 30;

function py(value: number) {
  return M.top + (1 - (value - Y_MIN) / (Y_MAX - Y_MIN)) * PH;
}

function px(day: number) {
  return M.left + ((day - X_MIN) / (X_MAX - X_MIN)) * PW;
}

function buildPath(data: ChartDataPoint[], key: keyof Omit<ChartDataPoint, 'day'>) {
  return data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${px(d.day).toFixed(1)},${py(d[key]).toFixed(1)}`)
    .join(' ');
}

export function ComplianceChart({ data, thresholdPercent = 72 }: ComplianceChartProps) {
  const [hoverDay, setHoverDay] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGRectElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const sp = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    const day = Math.round(X_MIN + ((sp.x - M.left) / PW) * (X_MAX - X_MIN));
    setHoverDay(Math.max(X_MIN, Math.min(X_MAX, day)));
  }, []);

  const handleMouseLeave = useCallback(() => setHoverDay(null), []);

  const hoverPoint = hoverDay != null ? data.find((d) => d.day === hoverDay) ?? null : null;
  const threshY = py(thresholdPercent);
  const bottomY = py(Y_MIN);
  const topY = py(Y_MAX);

  return (
    <div className="w-full select-none">
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-end mb-1 pr-2">
        {METRICS.map((m) => (
          <div key={m.key} className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: m.color }}
            />
            <span className="text-[12px] text-black tracking-[0.4px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              {m.label}
            </span>
          </div>
        ))}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full"
        style={{ aspectRatio: `${VW} / ${VH}`, height: 'auto' }}
        aria-label="Compliance trend chart"
      >
        {/* Non-compliance zone */}
        <rect x={M.left} y={threshY} width={PW} height={bottomY - threshY} fill="rgba(255,222,222,0.4)" />

        {/* Plot background border */}
        <rect x={M.left} y={topY} width={PW} height={PH} fill="white" stroke="#d6deed" strokeWidth={0.8} />

        {/* Horizontal grid lines */}
        {Y_TICKS.map((tick) => (
          <line
            key={`g${tick}`}
            x1={M.left} y1={py(tick)}
            x2={M.left + PW} y2={py(tick)}
            stroke="#DEE3F0"
            strokeWidth={0.8}
            strokeDasharray={tick % 10 !== 0 ? '2.5 3.3' : undefined}
          />
        ))}

        {/* Threshold line */}
        <line
          x1={M.left} y1={threshY}
          x2={M.left + PW} y2={threshY}
          stroke="#EB3333" strokeWidth={1.2} strokeDasharray="6 4"
        />
        {/* Threshold label pill */}
        <rect
          x={M.left + PW - 148} y={threshY - 16}
          width={148} height={14} rx={3} fill="#ffebeb"
        />
        <text
          x={M.left + PW - 144} y={threshY - 5}
          fill="#cc2121" fontSize={8}
          fontFamily="Inter, sans-serif" fontWeight={500}
        >
          Non-compliance threshold: {thresholdPercent}%
        </text>

        {/* Y-axis labels */}
        {Y_TICKS.map((tick) => (
          <text
            key={`yl${tick}`}
            x={M.left - 4} y={py(tick) + 3}
            textAnchor="end" fill="#808594"
            fontSize={8} fontFamily="Inter, sans-serif"
          >
            {tick}%
          </text>
        ))}

        {/* X-axis baseline */}
        <line
          x1={M.left} y1={bottomY}
          x2={M.left + PW} y2={bottomY}
          stroke="#BABFCC" strokeWidth={0.8}
        />

        {/* X-axis ticks + labels */}
        {X_TICKS.map((tick) => (
          <g key={`xt${tick}`}>
            <line x1={px(tick)} y1={bottomY} x2={px(tick)} y2={bottomY + 4} stroke="#BABFCC" strokeWidth={0.8} />
            <text
              x={px(tick)} y={bottomY + 13}
              textAnchor="middle" fill="#808594"
              fontSize={8} fontFamily="Inter, sans-serif"
            >
              Day {tick}
            </text>
          </g>
        ))}

        {/* Data lines */}
        {METRICS.map((m) => (
          <path
            key={`ln${m.key}`}
            d={buildPath(data, m.key)}
            fill="none"
            stroke={m.color}
            strokeWidth={m.strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* Hover crosshair */}
        {hoverDay != null && (
          <line
            x1={px(hoverDay)} y1={topY}
            x2={px(hoverDay)} y2={bottomY}
            stroke="#aaa" strokeWidth={1} strokeDasharray="3 3"
            pointerEvents="none"
          />
        )}

        {/* Hover dots */}
        {hoverPoint &&
          METRICS.map((m) => (
            <circle
              key={`dot${m.key}`}
              cx={px(hoverPoint.day)}
              cy={py(hoverPoint[m.key])}
              r={4}
              fill={m.color}
              pointerEvents="none"
            />
          ))}

        {/* Transparent mouse-capture overlay (must be last) */}
        <rect
          x={M.left} y={M.top}
          width={PW} height={PH}
          fill="transparent"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      </svg>

      {/* Hover tooltip */}
      {hoverPoint && (
        <div
          className="mx-[38px] px-3 py-2 bg-white border border-[#DEE3F0] rounded text-[12px] flex gap-4 flex-wrap"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <span className="font-medium text-[#151d1e]">Day {hoverPoint.day}</span>
          {METRICS.map((m) => (
            <div key={m.key} className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
              <span style={{ color: m.color }}>{hoverPoint[m.key]}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
