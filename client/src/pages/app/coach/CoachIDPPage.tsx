import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  ChevronRight,
  Film,
  Dumbbell,
  MessageSquare,
  Sparkles,
  Trash2,
  Clock,
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  Edit3,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

interface DrillLink {
  id: string;
  drillTitle: string;
  reps?: string;
  frequency?: string;
}

interface Milestone {
  id: string;
  title: string;
  dueDate?: string;
  completedAt?: string | null;
}

interface FocusArea {
  id: string;
  priority: number;
  category: string;
  subSkill: string;
  emoji: string;
  currentScore?: number;
  targetScore?: number;
  deadline?: string;
  status: "draft" | "active" | "completed" | "paused";
  coachNotes?: string;
  milestones: Milestone[];
  drills: DrillLink[];
}

interface IdpComment {
  id: string;
  body: string;
  type: "weekly_review" | "film_note" | "assessment" | "general";
  focusAreaId?: string;
  authorUserId: string;
  createdAt: string;
}

interface Idp {
  id: string;
  season: string;
  status: "active" | "paused" | "completed" | "archived";
}

interface PlayerInfo {
  id: string;
  name: string;
  position?: string;
  jerseyNumber?: string;
}

/* -------------------------------------------------------------------------- */
/* Mock data (replaces live API until auth is wired)                           */
/* -------------------------------------------------------------------------- */

const MOCK_PLAYER: PlayerInfo = {
  id: "p1",
  name: "Marcus Davis",
  position: "PG",
  jerseyNumber: "5",
};

const MOCK_IDP: Idp = {
  id: "idp1",
  season: "2024-25",
  status: "active",
};

const MOCK_FOCUS_AREAS: FocusArea[] = [
  {
    id: "fa1",
    priority: 1,
    category: "Finishing",
    subSkill: "Contact Layup",
    emoji: "🏀",
    currentScore: 5,
    targetScore: 7,
    deadline: "2025-06-15",
    status: "active",
    coachNotes:
      "You're making progress — keep attacking the rim in live reps. The Mikan drill is showing results.",
    milestones: [
      { id: "m1", title: "Score 6/10 on contact layup eval", dueDate: "2025-05-20", completedAt: null },
      { id: "m2", title: "Complete 300 Mikan drill reps", dueDate: "2025-06-01", completedAt: "2025-05-10" },
    ],
    drills: [
      { id: "dl1", drillTitle: "Mikan Drill", reps: "5 sets of 10", frequency: "daily" },
      { id: "dl2", drillTitle: "Euro Step Finishing", reps: "30 reps each side", frequency: "3x per week" },
    ],
  },
  {
    id: "fa2",
    priority: 2,
    category: "Shooting",
    subSkill: "Off Dribble",
    emoji: "🎯",
    currentScore: 6,
    targetScore: 8,
    deadline: "2025-07-01",
    status: "active",
    coachNotes: "Your DHO reads are getting sharper. Focus on the 1-2 step rhythm this week.",
    milestones: [
      { id: "m3", title: "60% pull-up chart in practice", dueDate: "2025-06-01", completedAt: null },
    ],
    drills: [
      { id: "dl3", drillTitle: "Pull-up off DHO", reps: "50 reps each side", frequency: "daily" },
    ],
  },
  {
    id: "fa3",
    priority: 3,
    category: "Ball Handling",
    subSkill: "Weak Hand",
    emoji: "✋",
    currentScore: 6,
    targetScore: 8,
    deadline: "2025-07-15",
    status: "active",
    coachNotes: "Great improvement. Left-only 3-cone milestone hit — nice work.",
    milestones: [
      { id: "m4", title: "Left-only 3-cone drill milestone", dueDate: "2025-05-01", completedAt: "2025-05-01" },
      { id: "m5", title: "Dribble hand-off at full speed in 5v5", dueDate: "2025-07-01", completedAt: null },
    ],
    drills: [
      { id: "dl4", drillTitle: "Left-only dribble warmup", reps: "10 minutes", frequency: "daily" },
    ],
  },
];

const MOCK_COMMENTS: IdpComment[] = [
  {
    id: "c1",
    body: "Strong month overall. Contact finishing lagging but Mikan work is showing up in practice reps. Keep the pressure on.",
    type: "weekly_review",
    authorUserId: "coach1",
    createdAt: "2025-05-05T10:00:00Z",
  },
  {
    id: "c2",
    body: "Watch your footwork on the euro step — fading instead of attacking. Going left and drawing the foul is the right read.",
    type: "film_note",
    focusAreaId: "fa1",
    authorUserId: "coach1",
    createdAt: "2025-05-02T09:00:00Z",
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const STATUS_COLORS: Record<FocusArea["status"], string> = {
  active:    "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  draft:     "bg-muted text-muted-foreground border-border",
  completed: "bg-primary/10 text-primary border-primary/30",
  paused:    "bg-amber-500/15 text-amber-600 border-amber-500/30",
};

const COMMENT_TYPE_LABEL: Record<IdpComment["type"], string> = {
  weekly_review: "Weekly Review",
  film_note: "Film Note",
  assessment: "Assessment",
  general: "Note",
};

const COMMENT_TYPE_COLOR: Record<IdpComment["type"], string> = {
  weekly_review: "bg-primary/10 text-primary border-primary/30",
  film_note:     "bg-amber-500/15 text-amber-600 border-amber-500/30",
  assessment:    "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  general:       "bg-muted text-muted-foreground border-border",
};

function fmtDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ScoreNumberLine({ current, target, max = 10 }: { current: number; target: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
        const isCurrent = n === current;
        const isTarget  = n === target;
        const isBetween = n > current && n <= target;
        return (
          <div
            key={n}
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold border ${
              isCurrent
                ? "bg-amber-500 border-amber-400 text-white"
                : isTarget
                ? "bg-primary border-primary text-primary-foreground"
                : isBetween
                ? "bg-primary/20 border-primary/30 text-primary/70"
                : "bg-muted border-border text-muted-foreground/50"
            }`}
          >
            {n}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FocusAreaCard                                                                */
/* -------------------------------------------------------------------------- */

function FocusAreaCard({
  area,
  playerId,
  idpId,
  onMilestoneToggle,
  onDrillRemove,
  onRemoveFocusArea,
  onUpdateNotes,
}: {
  area: FocusArea;
  playerId: string;
  idpId: string;
  onMilestoneToggle: (faId: string, mId: string, completed: boolean) => void;
  onDrillRemove: (faId: string, dlId: string) => void;
  onRemoveFocusArea: (faId: string) => void;
  onUpdateNotes: (faId: string, notes: string) => void;
}) {
  const [addMilestone, setAddMilestone] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [addDrill, setAddDrill] = useState(false);
  const [drillTitle, setDrillTitle] = useState("");
  const [drillReps, setDrillReps] = useState("");
  const [editNotes, setEditNotes] = useState(false);
  const [noteDraft, setNoteDraft] = useState(area.coachNotes ?? "");

  const totalMilestones = area.milestones.length;
  const doneMilestones  = area.milestones.filter((m) => m.completedAt).length;
  const progress = totalMilestones > 0 ? Math.round((doneMilestones / totalMilestones) * 100) : 0;

  const overdueCount = area.milestones.filter(
    (m) => !m.completedAt && m.dueDate && new Date(m.dueDate) < new Date(),
  ).length;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-muted/30">
        <span className="text-xl">{area.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
              Focus #{area.priority} · {area.category}
            </span>
            <Badge className={`text-[10px] border ${STATUS_COLORS[area.status]}`}>
              {area.status}
            </Badge>
            {overdueCount > 0 && (
              <Badge className="text-[10px] bg-rose-500/15 text-rose-600 border-rose-500/30">
                <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                {overdueCount} overdue
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-[15px] leading-tight truncate">{area.subSkill}</h3>
        </div>
        <button
          onClick={() => onRemoveFocusArea(area.id)}
          className="text-muted-foreground/40 hover:text-rose-500 transition ml-auto shrink-0"
          title="Remove focus area"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Score tracker */}
        {area.currentScore && area.targetScore && (
          <div>
            <div className="text-[10.5px] font-mono uppercase tracking-[0.1em] text-muted-foreground mb-2">
              Score · Current{" "}
              <span className="text-amber-500 font-bold">{area.currentScore}</span>{" "}
              → Target{" "}
              <span className="text-primary font-bold">{area.targetScore}</span> / 10
            </div>
            <ScoreNumberLine current={area.currentScore} target={area.targetScore} />
          </div>
        )}

        {/* Progress */}
        {totalMilestones > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-[0.1em]">
                Milestone progress
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11.5px] font-semibold">{doneMilestones}/{totalMilestones}</span>
                {area.deadline && (
                  <span className="text-[10.5px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Due {fmtDate(area.deadline)}
                  </span>
                )}
              </div>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Milestones */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
              Milestones
            </span>
            <button
              onClick={() => setAddMilestone(true)}
              className="text-[11px] text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>

          {area.milestones.length === 0 && !addMilestone && (
            <p className="text-[12px] text-muted-foreground italic">No milestones yet.</p>
          )}

          <div className="flex flex-col gap-1.5">
            {area.milestones.map((m) => {
              const isOverdue = !m.completedAt && m.dueDate && new Date(m.dueDate) < new Date();
              return (
                <div key={m.id} className="flex items-center gap-2.5">
                  <button
                    onClick={() => onMilestoneToggle(area.id, m.id, !m.completedAt)}
                    className="shrink-0"
                  >
                    {m.completedAt ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Circle className={`w-4 h-4 ${isOverdue ? "text-rose-500" : "text-muted-foreground/40"}`} />
                    )}
                  </button>
                  <span
                    className={`text-[12.5px] flex-1 leading-snug ${
                      m.completedAt ? "line-through text-muted-foreground" : isOverdue ? "text-rose-600" : ""
                    }`}
                  >
                    {m.title}
                  </span>
                  {m.dueDate && (
                    <span className={`text-[10px] font-mono shrink-0 ${isOverdue && !m.completedAt ? "text-rose-500" : "text-muted-foreground"}`}>
                      {fmtDate(m.dueDate)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {addMilestone && (
            <div className="mt-2 flex gap-2">
              <input
                autoFocus
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
                placeholder="Milestone title…"
                className="flex-1 h-8 text-[12.5px] px-3 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && milestoneTitle.trim()) {
                    toast.success("Milestone added");
                    setMilestoneTitle("");
                    setAddMilestone(false);
                  }
                  if (e.key === "Escape") { setAddMilestone(false); setMilestoneTitle(""); }
                }}
              />
              <Button
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => {
                  if (milestoneTitle.trim()) {
                    toast.success("Milestone added");
                    setMilestoneTitle("");
                    setAddMilestone(false);
                  }
                }}
              >
                <Check className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-xs"
                onClick={() => { setAddMilestone(false); setMilestoneTitle(""); }}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Drills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
              Assigned Drills
            </span>
            <button
              onClick={() => setAddDrill(true)}
              className="text-[11px] text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Link Drill
            </button>
          </div>

          {area.drills.length === 0 && !addDrill && (
            <p className="text-[12px] text-muted-foreground italic">No drills linked yet.</p>
          )}

          <div className="flex flex-col gap-1.5">
            {area.drills.map((dl) => (
              <div key={dl.id} className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[12.5px] font-medium">{dl.drillTitle}</span>
                  {dl.reps && (
                    <span className="text-[11px] text-muted-foreground ml-2">{dl.reps}</span>
                  )}
                  {dl.frequency && (
                    <span className="text-[10px] text-muted-foreground/70 ml-2">· {dl.frequency}</span>
                  )}
                </div>
                <button
                  onClick={() => onDrillRemove(area.id, dl.id)}
                  className="text-muted-foreground/40 hover:text-rose-500 transition shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {addDrill && (
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={drillTitle}
                  onChange={(e) => setDrillTitle(e.target.value)}
                  placeholder="Drill name…"
                  className="flex-1 h-8 text-[12.5px] px-3 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  value={drillReps}
                  onChange={(e) => setDrillReps(e.target.value)}
                  placeholder="Reps / sets"
                  className="w-28 h-8 text-[12.5px] px-3 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => {
                    if (drillTitle.trim()) {
                      toast.success("Drill linked");
                      setDrillTitle("");
                      setDrillReps("");
                      setAddDrill(false);
                    }
                  }}
                >
                  Link Drill
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs"
                  onClick={() => { setAddDrill(false); setDrillTitle(""); setDrillReps(""); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Coach notes */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
              Coach Note
            </span>
            {!editNotes && (
              <button
                onClick={() => setEditNotes(true)}
                className="text-[11px] text-primary hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                Edit
              </button>
            )}
          </div>
          {editNotes ? (
            <div className="flex flex-col gap-2">
              <textarea
                autoFocus
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={3}
                className="w-full text-[12.5px] px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-7 px-3 text-xs"
                  onClick={() => {
                    onUpdateNotes(area.id, noteDraft);
                    setEditNotes(false);
                    toast.success("Note saved");
                  }}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => { setEditNotes(false); setNoteDraft(area.coachNotes ?? ""); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-[12.5px] text-muted-foreground italic leading-relaxed">
              {area.coachNotes || "No note yet."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                    */
/* -------------------------------------------------------------------------- */

function IDPSkeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-6">
      <div className="h-20 rounded-xl bg-muted" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-64 rounded-xl bg-muted" />)}
        </div>
        <div className="flex flex-col gap-4">
          <div className="h-48 rounded-xl bg-muted" />
          <div className="h-64 rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Add Focus Area Form                                                          */
/* -------------------------------------------------------------------------- */

const CATEGORY_EMOJIS: Record<string, string> = {
  Shooting: "🎯", Finishing: "🏀", "Ball Handling": "✋", Footwork: "👟",
  Defense: "🛡️", "Decision-Making": "🧠", Conditioning: "💪", "Basketball IQ": "📊",
};

const CATEGORIES = Object.keys(CATEGORY_EMOJIS);

function AddFocusAreaForm({
  onAdd,
  onCancel,
}: {
  onAdd: (fa: Omit<FocusArea, "id" | "milestones" | "drills">) => void;
  onCancel: () => void;
}) {
  const [category, setCategory]   = useState("Shooting");
  const [subSkill, setSubSkill]   = useState("");
  const [current, setCurrent]     = useState("");
  const [target, setTarget]       = useState("");
  const [deadline, setDeadline]   = useState("");

  function submit() {
    if (!subSkill.trim()) { toast.error("Sub-skill required"); return; }
    onAdd({
      priority: 99,
      category,
      subSkill: subSkill.trim(),
      emoji: CATEGORY_EMOJIS[category] ?? "🏀",
      currentScore: current ? Number(current) : undefined,
      targetScore: target ? Number(target) : undefined,
      deadline: deadline || undefined,
      status: "active",
    });
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 flex flex-col gap-4">
      <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-primary">
        New Focus Area
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted-foreground mb-1">
            Category
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-9 px-3 rounded-md border border-border bg-background text-[13px] focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>

        <label className="block">
          <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted-foreground mb-1">
            Sub-skill <span className="text-primary">*</span>
          </div>
          <input
            autoFocus
            value={subSkill}
            onChange={(e) => setSubSkill(e.target.value)}
            placeholder="e.g. Contact Layup"
            className="w-full h-9 px-3 rounded-md border border-border bg-background text-[13px] focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>

        <label className="block">
          <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted-foreground mb-1">
            Current Score (1–10)
          </div>
          <input
            type="number"
            min={1}
            max={10}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="5"
            className="w-full h-9 px-3 rounded-md border border-border bg-background text-[13px] focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>

        <label className="block">
          <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted-foreground mb-1">
            Target Score (1–10)
          </div>
          <input
            type="number"
            min={1}
            max={10}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="7"
            className="w-full h-9 px-3 rounded-md border border-border bg-background text-[13px] focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>

        <label className="block sm:col-span-2">
          <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted-foreground mb-1">
            Deadline
          </div>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full h-9 px-3 rounded-md border border-border bg-background text-[13px] focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={submit} className="text-xs">
          Add Focus Area
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} className="text-xs">
          Cancel
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export function CoachIDPPage() {
  const params = useParams<{ id: string }>();
  const playerId = params.id;

  const [isLoading, setIsLoading]   = useState(true);
  const [player, setPlayer]         = useState<PlayerInfo | null>(null);
  const [idp, setIdp]               = useState<Idp | null>(null);
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [comments, setComments]     = useState<IdpComment[]>([]);
  const [showAddFA, setShowAddFA]   = useState(false);
  const [generating, setGenerating] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [commentType, setCommentType] = useState<IdpComment["type"]>("general");

  useEffect(() => {
    const t = setTimeout(() => {
      setPlayer(MOCK_PLAYER);
      setIdp(MOCK_IDP);
      setFocusAreas(MOCK_FOCUS_AREAS);
      setComments(MOCK_COMMENTS);
      setIsLoading(false);
    }, 480);
    return () => clearTimeout(t);
  }, [playerId]);

  function handleMilestoneToggle(faId: string, mId: string, completed: boolean) {
    setFocusAreas((prev) =>
      prev.map((fa) =>
        fa.id !== faId
          ? fa
          : {
              ...fa,
              milestones: fa.milestones.map((m) =>
                m.id !== mId ? m : { ...m, completedAt: completed ? new Date().toISOString() : null },
              ),
            },
      ),
    );
    toast.success(completed ? "Milestone completed!" : "Milestone reopened");
  }

  function handleDrillRemove(faId: string, dlId: string) {
    setFocusAreas((prev) =>
      prev.map((fa) =>
        fa.id !== faId ? fa : { ...fa, drills: fa.drills.filter((d) => d.id !== dlId) },
      ),
    );
    toast.success("Drill removed");
  }

  function handleRemoveFocusArea(faId: string) {
    setFocusAreas((prev) => prev.filter((fa) => fa.id !== faId));
    toast.success("Focus area removed");
  }

  function handleUpdateNotes(faId: string, notes: string) {
    setFocusAreas((prev) =>
      prev.map((fa) => (fa.id !== faId ? fa : { ...fa, coachNotes: notes })),
    );
  }

  function handleAddFocusArea(data: Omit<FocusArea, "id" | "milestones" | "drills">) {
    const newFA: FocusArea = {
      ...data,
      id: `fa-${Date.now()}`,
      priority: focusAreas.length + 1,
      milestones: [],
      drills: [],
    };
    setFocusAreas((prev) => [...prev, newFA]);
    setShowAddFA(false);
    toast.success("Focus area added");
  }

  function handleGenerate() {
    setGenerating(true);
    setTimeout(() => {
      const generated: FocusArea[] = [
        {
          id: `fa-gen-${Date.now()}`,
          priority: focusAreas.length + 1,
          category: "Defense",
          subSkill: "On-Ball Pressure",
          emoji: "🛡️",
          currentScore: 4,
          targetScore: 6,
          deadline: "2025-08-01",
          status: "active",
          coachNotes: "Auto-generated from skill assessment gap (Defense: 4.2 avg).",
          milestones: [],
          drills: [],
        },
      ];
      setFocusAreas((prev) => [...prev, ...generated]);
      setGenerating(false);
      toast.success(`Generated ${generated.length} focus area from skill gaps`);
    }, 1200);
  }

  function handleAddComment() {
    if (!commentBody.trim()) return;
    const newComment: IdpComment = {
      id: `c-${Date.now()}`,
      body: commentBody.trim(),
      type: commentType,
      authorUserId: "coach1",
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [newComment, ...prev]);
    setCommentBody("");
    setCommentType("general");
    toast.success("Comment added");
  }

  // ── Derived stats ────────────────────────────────────────────────────────
  const totalMilestones = focusAreas.reduce((s, fa) => s + fa.milestones.length, 0);
  const doneMilestones  = focusAreas.reduce((s, fa) => s + fa.milestones.filter((m) => m.completedAt).length, 0);
  const overdueMilestones = focusAreas.reduce(
    (s, fa) =>
      s + fa.milestones.filter((m) => !m.completedAt && m.dueDate && new Date(m.dueDate) < new Date()).length,
    0,
  );

  if (isLoading) {
    return (
      <AppShell>
        <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
          <IDPSkeleton />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        {/* Back link */}
        <div className="mb-4">
          <Link href={`/app/coach/players/${playerId}`} asChild>
            <a className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground transition">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to {player?.name ?? "Player"} Profile
            </a>
          </Link>
        </div>

        <PageHeader
          eyebrow={`${player?.position ?? ""}${player?.jerseyNumber ? ` · #${player.jerseyNumber}` : ""} · Season ${idp?.season ?? ""}`}
          title={`${player?.name ?? "Player"} · Development Plan`}
          subtitle="Coach view — manage focus areas, milestones, drill prescriptions, and weekly review notes."
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={generating || !idp}
                className="text-xs gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {generating ? "Generating…" : "Generate from Gaps"}
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddFA(true)}
                disabled={!idp}
                className="text-xs gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Focus Area
              </Button>
            </div>
          }
        />

        {/* No IDP state */}
        {!idp && (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Target className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-semibold text-[16px] mb-1">No development plan yet</h3>
            <p className="text-[13px] text-muted-foreground mb-5">
              Create an IDP to start tracking focus areas, milestones, and drill prescriptions.
            </p>
            <Button size="sm" className="text-xs">
              Create IDP for 2024–25
            </Button>
          </div>
        )}

        {idp && (
          <>
            {/* Summary strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                {
                  label: "Focus Areas",
                  value: focusAreas.filter((fa) => fa.status === "active").length,
                  sub: `${focusAreas.length} total`,
                  color: "text-primary",
                },
                {
                  label: "Milestones Done",
                  value: `${doneMilestones}/${totalMilestones}`,
                  sub: totalMilestones > 0 ? `${Math.round((doneMilestones / totalMilestones) * 100)}% complete` : "no milestones",
                  color: "text-emerald-500",
                },
                {
                  label: "Overdue",
                  value: overdueMilestones,
                  sub: overdueMilestones > 0 ? "need attention" : "all on track",
                  color: overdueMilestones > 0 ? "text-rose-500" : "text-muted-foreground",
                },
                {
                  label: "Coach Notes",
                  value: comments.length,
                  sub: "total entries",
                  color: "text-muted-foreground",
                },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-card p-4">
                  <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-muted-foreground mb-1">
                    {s.label}
                  </div>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left: Focus areas */}
              <div className="lg:col-span-2 flex flex-col gap-5">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-[15px]">Focus Areas</h2>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {focusAreas.length} active
                  </Badge>
                </div>

                {showAddFA && (
                  <AddFocusAreaForm
                    onAdd={handleAddFocusArea}
                    onCancel={() => setShowAddFA(false)}
                  />
                )}

                {focusAreas.length === 0 && !showAddFA && (
                  <div className="rounded-xl border border-dashed border-border p-10 text-center">
                    <Target className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-[13px] text-muted-foreground mb-3">
                      No focus areas yet. Add one manually or generate from skill gaps.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" variant="outline" onClick={() => setShowAddFA(true)} className="text-xs">
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Manually
                      </Button>
                      <Button size="sm" onClick={handleGenerate} disabled={generating} className="text-xs">
                        <Sparkles className="w-3.5 h-3.5 mr-1" />
                        Generate from Gaps
                      </Button>
                    </div>
                  </div>
                )}

                {focusAreas.map((fa) => (
                  <FocusAreaCard
                    key={fa.id}
                    area={fa}
                    playerId={playerId}
                    idpId={idp.id}
                    onMilestoneToggle={handleMilestoneToggle}
                    onDrillRemove={handleDrillRemove}
                    onRemoveFocusArea={handleRemoveFocusArea}
                    onUpdateNotes={handleUpdateNotes}
                  />
                ))}
              </div>

              {/* Right: Comments */}
              <div className="flex flex-col gap-5">
                {/* Add comment */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold text-[15px]">Add Review Note</h2>
                  </div>

                  <div className="flex flex-col gap-3">
                    <select
                      value={commentType}
                      onChange={(e) => setCommentType(e.target.value as IdpComment["type"])}
                      className="w-full h-8 px-2 rounded-md border border-border bg-background text-[12.5px] focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="weekly_review">Weekly Review</option>
                      <option value="film_note">Film Note</option>
                      <option value="assessment">Assessment Note</option>
                      <option value="general">General</option>
                    </select>
                    <textarea
                      value={commentBody}
                      onChange={(e) => setCommentBody(e.target.value)}
                      rows={4}
                      placeholder="Write your review note or film observation…"
                      className="w-full text-[12.5px] px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!commentBody.trim()}
                      className="text-xs w-full"
                    >
                      Save Note
                    </Button>
                  </div>
                </div>

                {/* Comment history */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold text-[15px]">Review History</h2>
                  </div>

                  {comments.length === 0 && (
                    <p className="text-[12.5px] text-muted-foreground italic">No notes yet.</p>
                  )}

                  <div className="flex flex-col gap-4">
                    {comments.map((c) => (
                      <div key={c.id} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-[9.5px] border ${COMMENT_TYPE_COLOR[c.type]}`}>
                            {COMMENT_TYPE_LABEL[c.type]}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                            {fmtDate(c.createdAt)}
                          </span>
                          <button
                            onClick={() => {
                              setComments((prev) => prev.filter((x) => x.id !== c.id));
                              toast.success("Note deleted");
                            }}
                            className="text-muted-foreground/30 hover:text-rose-500 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-[12.5px] text-muted-foreground leading-relaxed">{c.body}</p>
                        <div className="border-b border-border/50 last:hidden" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick links */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted-foreground mb-3">
                    Quick Links
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link href={`/app/coach/players/${playerId}`} asChild>
                      <a className="flex items-center gap-2 text-[12.5px] hover:text-primary transition">
                        <ChevronRight className="w-3.5 h-3.5" />
                        Player Profile
                      </a>
                    </Link>
                    <Link href="/app/coach/drill-library" asChild>
                      <a className="flex items-center gap-2 text-[12.5px] hover:text-primary transition">
                        <Dumbbell className="w-3.5 h-3.5" />
                        Drill Library
                      </a>
                    </Link>
                    <Link href="/app/coach/film" asChild>
                      <a className="flex items-center gap-2 text-[12.5px] hover:text-primary transition">
                        <Film className="w-3.5 h-3.5" />
                        Film Room
                      </a>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default CoachIDPPage;
