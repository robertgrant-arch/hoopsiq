/**
 * PlayThumbnail — read-only SVG render of a phase, used in:
 *  - Phase timeline thumbnails
 *  - Play list cards
 *  - Quiz preview tiles
 */
import { HalfCourt } from "./HalfCourt";
import type { PlayPhase, PlayPath } from "@/features/playbook/mock";

const PATH_STYLE: Record<PlayPath["type"], { stroke: string; dash?: string; arrow: boolean; label: string }> = {
  PASS: { stroke: "oklch(0.85 0.18 80)", dash: "8 6", arrow: true, label: "P" },
  DRIBBLE: { stroke: "oklch(0.78 0.16 30)", arrow: true, label: "D" },
  CUT: { stroke: "oklch(0.85 0.05 200)", arrow: true, label: "C" },
  SCREEN: { stroke: "oklch(0.85 0.16 320)", arrow: false, label: "S" },
  HANDOFF: { stroke: "oklch(0.78 0.16 75)", dash: "4 4", arrow: true, label: "H" },
};

function pathD(points: number[]): string {
  if (points.length < 4) return "";
  if (points.length === 4) return `M ${points[0]} ${points[1]} L ${points[2]} ${points[3]}`;
  // quadratic
  return `M ${points[0]} ${points[1]} Q ${points[2]} ${points[3]} ${points[4]} ${points[5]}`;
}

function endAngle(points: number[]): number {
  if (points.length === 4) {
    return Math.atan2(points[3] - points[1], points[2] - points[0]);
  }
  // quadratic — use direction from control to end
  return Math.atan2(points[5] - points[3], points[4] - points[2]);
}

export function PlayThumbnail({
  phase,
  width = 200,
  height = 150,
  showLabels = true,
}: {
  phase: PlayPhase;
  width?: number;
  height?: number;
  showLabels?: boolean;
}) {
  return (
    <div className="relative" style={{ width, height }}>
      <HalfCourt width={width} height={height} variant="dark" className="absolute inset-0" />
      <svg viewBox="0 0 800 600" width={width} height={height} className="absolute inset-0" preserveAspectRatio="xMidYMid meet">
        {/* Paths */}
        {phase.paths.map((pa) => {
          const s = PATH_STYLE[pa.type];
          const ang = endAngle(pa.points);
          const ex = pa.points[pa.points.length - 2];
          const ey = pa.points[pa.points.length - 1];
          return (
            <g key={pa.id}>
              <path
                d={pathD(pa.points)}
                stroke={s.stroke}
                strokeWidth={pa.type === "SCREEN" ? 6 : 3}
                fill="none"
                strokeDasharray={s.dash}
                strokeLinecap={pa.type === "SCREEN" ? "butt" : "round"}
              />
              {pa.type === "SCREEN" && (
                <circle cx={ex} cy={ey} r={6} fill={s.stroke} />
              )}
              {s.arrow && (
                <polygon
                  points={`0,-7 16,0 0,7`}
                  fill={s.stroke}
                  transform={`translate(${ex} ${ey}) rotate(${(ang * 180) / Math.PI})`}
                />
              )}
            </g>
          );
        })}

        {/* Tokens */}
        {phase.tokens.map((t) => {
          if (t.type === "BALL") {
            return (
              <g key={t.id}>
                <circle cx={t.x} cy={t.y} r={14} fill="oklch(0.78 0.18 50)" stroke="oklch(0.4 0.1 50)" strokeWidth={2} />
                <line x1={t.x - 10} y1={t.y} x2={t.x + 10} y2={t.y} stroke="oklch(0.3 0.05 50)" strokeWidth={1.5} />
                <line x1={t.x} y1={t.y - 10} x2={t.x} y2={t.y + 10} stroke="oklch(0.3 0.05 50)" strokeWidth={1.5} />
              </g>
            );
          }
          if (t.type === "OFFENSE") {
            return (
              <g key={t.id}>
                <circle cx={t.x} cy={t.y} r={20} fill="oklch(0.95 0.05 80)" stroke="oklch(0.3 0.04 80)" strokeWidth={2} />
                {showLabels && (
                  <text x={t.x} y={t.y + 6} textAnchor="middle" fontSize={18} fontWeight={700} fill="oklch(0.2 0.04 80)" fontFamily="monospace">
                    {t.label}
                  </text>
                )}
              </g>
            );
          }
          if (t.type === "DEFENSE") {
            return (
              <g key={t.id}>
                <rect x={t.x - 18} y={t.y - 18} width={36} height={36} fill="oklch(0.45 0.18 25)" stroke="oklch(0.25 0.1 25)" strokeWidth={2} rx={4} />
                {showLabels && (
                  <text x={t.x} y={t.y + 6} textAnchor="middle" fontSize={16} fontWeight={700} fill="oklch(0.95 0.05 25)" fontFamily="monospace">
                    {t.label}
                  </text>
                )}
              </g>
            );
          }
          return (
            <polygon
              key={t.id}
              points={`${t.x},${t.y - 14} ${t.x - 12},${t.y + 8} ${t.x + 12},${t.y + 8}`}
              fill="oklch(0.6 0.08 80)"
              stroke="oklch(0.3 0.04 80)"
              strokeWidth={1.5}
            />
          );
        })}
      </svg>
    </div>
  );
}

export default PlayThumbnail;
