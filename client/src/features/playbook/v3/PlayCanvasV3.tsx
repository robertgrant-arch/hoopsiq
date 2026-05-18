/**
 * PlayCanvasV3 — frame-based canvas for the action-model Playbook Studio.
 *
 * Renders positions exclusively from `frames = resolvePlay(play)`. Tools
 * emit `Action` records via the v3 store; positions for downstream phases
 * are derived, never copied.
 *
 * Interaction model (v3):
 *   SELECT          — click a player to select them
 *   DRAW_CUT        — pointerdown on a player → drag → release; endpoint
 *                     snaps via snapToCourt(); commits a `cut` Action.
 *   DRAW_DRIBBLE    — same as DRAW_CUT but only valid on the ball holder;
 *                     commits a `dribble` Action and transfers the ball.
 *   DRAW_PASS       — click any player to set the target; from is the
 *                     ball holder; commits a `pass` Action.
 *   DRAW_SCREEN     — click a player (screener) → click an `at` point on
 *                     the court (snapped) → click a target (for); commits
 *                     a `screen` Action.
 *   DRAW_HANDOFF    — click ball holder (from) → click `at` (snapped)
 *                     → click another player (to); commits `handoff`.
 */
import { useMemo, useRef, useState } from "react";
import { Stage, Layer, Group, Circle, Line, Rect, Text, Shape } from "react-konva";
import type Konva from "konva";
import { HalfCourt } from "@/components/court/HalfCourt";
import type {
  Action,
  Phase,
  Play,
  PlayerId,
  ResolvedFrame,
  Vec2,
} from "../../../../src/playbook/types";
import { resolvePlay } from "../../../../src/playbook/resolver";
import { snapToCourt } from "../../../../src/playbook/snap";
import type { ToolMode } from "./store";

const STAGE_W = 800;
const STAGE_H = 600;

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

const PATH_STYLE: Record<
  Action["kind"],
  { stroke: string; dash?: number[]; arrow: boolean; width: number }
> = {
  cut: { stroke: "#cbd5e1", arrow: true, width: 3 },
  dribble: { stroke: "#fb923c", arrow: true, width: 3 },
  pass: { stroke: "#fde68a", dash: [10, 6], arrow: true, width: 3 },
  screen: { stroke: "#f0abfc", arrow: false, width: 6 },
  handoff: { stroke: "#fbbf24", dash: [4, 4], arrow: true, width: 3 },
};

function endTangentAngle(points: number[]): number {
  if (points.length < 4) return 0;
  const x1 = points[points.length - 4];
  const y1 = points[points.length - 3];
  const x2 = points[points.length - 2];
  const y2 = points[points.length - 1];
  return Math.atan2(y2 - y1, x2 - x1);
}

function flatten(path: Vec2[]): number[] {
  const out: number[] = [];
  for (const p of path) {
    out.push(p.x * STAGE_W, p.y * STAGE_H);
  }
  return out;
}

type Props = {
  play: Play;
  phaseIndex: number;
  toolMode: ToolMode;
  selectedPlayerId: PlayerId | null;
  width: number;
  height: number;
  /** When non-null, render these animated positions instead of the resolved frame. */
  animatedPositions?: Record<PlayerId, Vec2> | null;
  animatedBallHolder?: PlayerId | null;
  onSelectPlayer: (id: PlayerId | null) => void;
  onAddAction: (phaseIndex: number, action: Action) => void;
};

type Draft =
  | null
  | {
      kind: "cut" | "dribble";
      player: PlayerId;
      points: Vec2[]; // normalized 0..1
    }
  | { kind: "screen-need-at"; screener: PlayerId }
  | { kind: "screen-need-for"; screener: PlayerId; at: Vec2 }
  | { kind: "handoff-need-at"; from: PlayerId }
  | { kind: "handoff-need-to"; from: PlayerId; at: Vec2 };

export function PlayCanvasV3({
  play,
  phaseIndex,
  toolMode,
  selectedPlayerId,
  width,
  height,
  animatedPositions,
  animatedBallHolder,
  onSelectPlayer,
  onAddAction,
}: Props) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const [draft, setDraft] = useState<Draft>(null);
  const [, setTick] = useState(0);
  const force = () => setTick((n) => n + 1);

  const scale = useMemo(() => Math.min(width / STAGE_W, height / STAGE_H), [width, height]);
  const stagePxW = STAGE_W * scale;
  const stagePxH = STAGE_H * scale;

  const frames = useMemo(() => resolvePlay(play), [play]);
  const idx = Math.max(0, Math.min(frames.length - 1, phaseIndex));
  const frame: ResolvedFrame =
    animatedPositions && animatedBallHolder
      ? { positions: animatedPositions, ballHolder: animatedBallHolder }
      : frames[idx];

  const phase: Phase | undefined = play.phases[idx];
  const phasePaths: { kind: Action["kind"]; points: number[] }[] = useMemo(() => {
    const arr: { kind: Action["kind"]; points: number[] }[] = [];
    if (!phase) return arr;
    const startFrame = frames[idx];
    for (const a of phase.actions) {
      if (a.kind === "cut" || a.kind === "dribble") {
        arr.push({ kind: a.kind, points: flatten(a.path) });
      } else if (a.kind === "pass") {
        const from = startFrame.positions[a.from];
        const to = startFrame.positions[a.to];
        if (from && to) {
          arr.push({ kind: "pass", points: flatten([from, to]) });
        }
      } else if (a.kind === "screen") {
        const from = startFrame.positions[a.screener];
        if (from) arr.push({ kind: "screen", points: flatten([from, a.at]) });
      } else if (a.kind === "handoff") {
        const from = startFrame.positions[a.from];
        if (from) arr.push({ kind: "handoff", points: flatten([from, a.at]) });
      }
    }
    return arr;
  }, [phase, frames, idx]);

  /* -------------------- helpers -------------------- */

  function pointerToCourt(): Vec2 {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pos = stage.getPointerPosition();
    if (!pos) return { x: 0, y: 0 };
    return {
      x: clamp(pos.x / scale / STAGE_W, 0, 1),
      y: clamp(pos.y / scale / STAGE_H, 0, 1),
    };
  }

  function otherPositions(excludePlayer?: PlayerId): Vec2[] {
    const out: Vec2[] = [];
    for (const [pid, p] of Object.entries(frame.positions)) {
      if (pid !== excludePlayer) out.push(p);
    }
    return out;
  }

  /* -------------------- pointer handlers -------------------- */

  function handleStageMouseDown() {
    const pt = pointerToCourt();
    const target = stageRef.current?.getIntersection({
      x: pt.x * STAGE_W * scale,
      y: pt.y * STAGE_H * scale,
    });
    const tokenIdAttr = (target?.findAncestor("Group", true) as Konva.Group | undefined)?.getAttr(
      "data-player-id",
    ) as PlayerId | undefined;

    /* SELECT — click a player to select; click empty stage clears */
    if (toolMode === "SELECT") {
      onSelectPlayer(tokenIdAttr ?? null);
      return;
    }

    /* DRAW_CUT — drag from a player */
    if (toolMode === "DRAW_CUT") {
      if (!tokenIdAttr) return;
      onSelectPlayer(tokenIdAttr);
      const start = frame.positions[tokenIdAttr] ?? pt;
      setDraft({ kind: "cut", player: tokenIdAttr, points: [start, pt] });
      return;
    }

    /* DRAW_DRIBBLE — drag from ball holder only */
    if (toolMode === "DRAW_DRIBBLE") {
      if (!tokenIdAttr || tokenIdAttr !== frame.ballHolder) return;
      onSelectPlayer(tokenIdAttr);
      const start = frame.positions[tokenIdAttr] ?? pt;
      setDraft({ kind: "dribble", player: tokenIdAttr, points: [start, pt] });
      return;
    }

    /* DRAW_PASS — click target player; from = ballHolder */
    if (toolMode === "DRAW_PASS") {
      if (!tokenIdAttr) return;
      if (tokenIdAttr === frame.ballHolder) return;
      onAddAction(idx, { kind: "pass", from: frame.ballHolder, to: tokenIdAttr });
      return;
    }

    /* DRAW_SCREEN — three-click flow: screener → at (snapped) → for */
    if (toolMode === "DRAW_SCREEN") {
      if (!draft) {
        if (!tokenIdAttr) return;
        setDraft({ kind: "screen-need-at", screener: tokenIdAttr });
        onSelectPlayer(tokenIdAttr);
        return;
      }
      if (draft.kind === "screen-need-at") {
        const snapped = snapToCourt(pt, otherPositions(draft.screener));
        setDraft({ kind: "screen-need-for", screener: draft.screener, at: snapped });
        return;
      }
      if (draft.kind === "screen-need-for") {
        if (!tokenIdAttr || tokenIdAttr === draft.screener) return;
        onAddAction(idx, {
          kind: "screen",
          screener: draft.screener,
          for: tokenIdAttr,
          at: draft.at,
        });
        setDraft(null);
        return;
      }
    }

    /* DRAW_HANDOFF — three-click flow: from → at (snapped) → to */
    if (toolMode === "DRAW_HANDOFF") {
      if (!draft) {
        if (!tokenIdAttr) return;
        setDraft({ kind: "handoff-need-at", from: tokenIdAttr });
        onSelectPlayer(tokenIdAttr);
        return;
      }
      if (draft.kind === "handoff-need-at") {
        const snapped = snapToCourt(pt, otherPositions(draft.from));
        setDraft({ kind: "handoff-need-to", from: draft.from, at: snapped });
        return;
      }
      if (draft.kind === "handoff-need-to") {
        if (!tokenIdAttr || tokenIdAttr === draft.from) return;
        onAddAction(idx, {
          kind: "handoff",
          from: draft.from,
          to: tokenIdAttr,
          at: draft.at,
        });
        setDraft(null);
        return;
      }
    }
  }

  function handleStageMouseMove() {
    if (!draft) return;
    if (draft.kind !== "cut" && draft.kind !== "dribble") return;
    const pt = pointerToCourt();
    const last = draft.points[draft.points.length - 1];
    const dx = pt.x - last.x;
    const dy = pt.y - last.y;
    if (dx * dx + dy * dy < 0.0004) return; // ~2% step threshold
    setDraft({ ...draft, points: [...draft.points, pt] });
    force();
  }

  function handleStageMouseUp() {
    if (!draft) return;
    if (draft.kind !== "cut" && draft.kind !== "dribble") return;
    if (draft.points.length < 2) {
      setDraft(null);
      return;
    }
    const raw = draft.points[draft.points.length - 1];
    const snapped = snapToCourt(raw, otherPositions(draft.player));
    const path = [...draft.points.slice(0, -1), snapped];
    onAddAction(idx, { kind: draft.kind, player: draft.player, path, ...(draft.kind === "cut" ? { style: "curve" as const } : {}) } as Action);
    setDraft(null);
  }

  /* -------------------- render -------------------- */

  function renderActionPath(a: { kind: Action["kind"]; points: number[] }, key: number) {
    const style = PATH_STYLE[a.kind];
    const pts = a.points;
    if (pts.length < 4) return null;
    const ex = pts[pts.length - 2];
    const ey = pts[pts.length - 1];
    const ang = endTangentAngle(pts);
    return (
      <Group key={`pa_${key}`} listening={false}>
        <Shape
          sceneFunc={(ctx, shape) => {
            ctx.beginPath();
            ctx.moveTo(pts[0], pts[1]);
            for (let i = 2; i + 1 < pts.length; i += 2) {
              ctx.lineTo(pts[i], pts[i + 1]);
            }
            if (style.dash) ctx.setLineDash(style.dash);
            ctx.strokeShape(shape);
          }}
          stroke={style.stroke}
          strokeWidth={style.width}
          lineCap="round"
          lineJoin="round"
        />
        {a.kind === "screen" && (
          <Line
            points={[
              ex - 14 * Math.cos(ang + Math.PI / 2),
              ey - 14 * Math.sin(ang + Math.PI / 2),
              ex + 14 * Math.cos(ang + Math.PI / 2),
              ey + 14 * Math.sin(ang + Math.PI / 2),
            ]}
            stroke={style.stroke}
            strokeWidth={6}
          />
        )}
        {style.arrow && (
          <Line
            points={[0, -8, 18, 0, 0, 8]}
            closed
            fill={style.stroke}
            x={ex}
            y={ey}
            rotation={(ang * 180) / Math.PI}
          />
        )}
      </Group>
    );
  }

  function renderDraft() {
    if (!draft) return null;
    if (draft.kind !== "cut" && draft.kind !== "dribble") return null;
    const pts = flatten(draft.points);
    if (pts.length < 4) return null;
    return (
      <Shape
        listening={false}
        sceneFunc={(ctx, shape) => {
          ctx.beginPath();
          ctx.moveTo(pts[0], pts[1]);
          for (let i = 2; i + 1 < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
          ctx.setLineDash([6, 4]);
          ctx.strokeShape(shape);
        }}
        stroke="rgba(251,191,36,0.85)"
        strokeWidth={2}
        lineCap="round"
        lineJoin="round"
      />
    );
  }

  function renderPlayer(pid: PlayerId, p: Vec2) {
    const isSelected = selectedPlayerId === pid;
    const hasBall = frame.ballHolder === pid;
    const x = p.x * STAGE_W;
    const y = p.y * STAGE_H;
    return (
      <Group key={pid} x={x} y={y} data-player-id={pid}>
        <Circle
          radius={22}
          fill="#fef3c7"
          stroke={isSelected ? "#fbbf24" : "#92400e"}
          strokeWidth={isSelected ? 4 : 2}
        />
        {hasBall && (
          <Circle radius={9} fill="#facc15" stroke="#7c2d12" strokeWidth={1.5} y={-26} />
        )}
        <Text
          text={pid}
          fontSize={20}
          fontStyle="bold"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
          fill="#451a03"
          offsetX={pid.length * 5.5}
          offsetY={10}
        />
      </Group>
    );
  }

  return (
    <div
      style={{
        width: stagePxW,
        height: stagePxH,
        position: "relative",
        cursor:
          toolMode === "SELECT"
            ? "default"
            : toolMode.startsWith("DRAW_")
              ? "crosshair"
              : "default",
      }}
    >
      <HalfCourt
        width={stagePxW}
        height={stagePxH}
        className="absolute inset-0 pointer-events-none"
      />
      <Stage
        ref={stageRef}
        width={stagePxW}
        height={stagePxH}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={handleStageMouseDown}
        onTouchStart={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onTouchMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onTouchEnd={handleStageMouseUp}
      >
        <Layer>
          <Rect name="court-bg" x={0} y={0} width={STAGE_W} height={STAGE_H} fill="transparent" />
          {phasePaths.map(renderActionPath)}
          {renderDraft()}
        </Layer>
        <Layer>
          {Object.entries(frame.positions).map(([pid, p]) => renderPlayer(pid, p))}
        </Layer>
      </Stage>
    </div>
  );
}

export default PlayCanvasV3;
