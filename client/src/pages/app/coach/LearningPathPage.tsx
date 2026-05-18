/**
 * LearningPathPage
 *
 * Route /app/coach/education/paths          → path overview (3 accordion cards)
 * Route /app/coach/education/module/:id     → 5-section module reader
 */

import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import {
  BookOpen,
  Lock,
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  GraduationCap,
  Award,
  Target,
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  PlayCircle,
  Pencil,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  learningPaths,
  getModule,
  type LearningPath,
  type EducationModule,
  type ModuleSection,
} from "@/features/coach-education/education";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  "player-dev": "Player Dev",
  "practice-design": "Practice Design",
  film: "Film",
  communication: "Communication",
  data: "Data",
  leadership: "Leadership",
};

const CATEGORY_COLORS: Record<string, string> = {
  "player-dev": "oklch(0.72 0.18 290)",
  "practice-design": "oklch(0.75 0.12 140)",
  film: "oklch(0.65 0.15 220)",
  communication: "oklch(0.70 0.14 170)",
  data: "oklch(0.78 0.16 75)",
  leadership: "oklch(0.68 0.22 25)",
};

function pathCompletedCount(path: LearningPath): number {
  return path.modules.filter((m) => m.status === "complete").length;
}

function domainToColor(domain: string): string {
  if (domain.includes("Film")) return "oklch(0.65 0.15 220)";
  if (domain.includes("Practice") || domain.includes("WOD") || domain.includes("Drill") || domain.includes("Teaching") || domain.includes("Cue")) return "oklch(0.75 0.12 140)";
  if (domain.includes("Communication") || domain.includes("Parent")) return "oklch(0.70 0.14 170)";
  if (domain.includes("Program") || domain.includes("Accountability")) return "oklch(0.68 0.22 25)";
  if (domain.includes("Player") || domain.includes("IDP")) return "oklch(0.72 0.18 290)";
  // slug fallbacks
  return CATEGORY_COLORS[domain] ?? "oklch(0.55 0.02 260)";
}

function domainToLabel(domain: string): string {
  if (domain.includes("Player") || domain.includes("IDP")) return "Player Dev";
  if (domain.includes("Practice") || domain.includes("WOD") || domain.includes("Drill")) return "Practice Design";
  if (domain.includes("Film")) return "Film";
  if (domain.includes("Communication") || domain.includes("Parent")) return "Communication";
  if (domain.includes("Program") || domain.includes("Accountability")) return "Leadership";
  if (domain.includes("Teaching") || domain.includes("Cue")) return "Teaching";
  return CATEGORY_LABELS[domain] ?? domain;
}

function CategoryBadge({ category }: { category: string }) {
  const color = domainToColor(category);
  return (
    <span
      className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
      style={{ color, background: `color-mix(in oklch, ${color} 12%, transparent)` }}
    >
      {domainToLabel(category)}
    </span>
  );
}


// ─── Path Overview ────────────────────────────────────────────────────────────

function PathCard({
  path,
  locked,
  defaultOpen,
}: {
  path: LearningPath;
  locked: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const done = pathCompletedCount(path);
  const total = path.modules.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const levelColors: Record<number, string> = {
    1: "oklch(0.65 0.15 220)",
    2: "oklch(0.72 0.18 290)",
    3: "oklch(0.78 0.16 75)",
  };
  const color = levelColors[path.level] ?? "oklch(0.55 0.02 260)";

  return (
    <div
      className={`rounded-xl border border-border bg-card transition-opacity ${locked ? "opacity-60" : ""}`}
    >
      <button
        onClick={() => !locked && setOpen((o) => !o)}
        className="w-full flex items-start gap-4 p-5 text-left"
        disabled={locked}
      >
        <div
          className="size-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: `color-mix(in oklch, ${color} 15%, transparent)` }}
        >
          {locked ? (
            <Lock className="size-5" style={{ color }} />
          ) : (
            <GraduationCap className="size-5" style={{ color }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color }}
            >
              Level {path.level}
            </span>
            {locked && (
              <span className="text-[11px] text-muted-foreground px-2 py-0.5 rounded-full border border-border">
                Locked
              </span>
            )}
          </div>
          <h3 className="text-[15px] font-semibold mb-1">{path.title}</h3>
          <p className="text-[13px] text-muted-foreground line-clamp-2 mb-3">
            {path.description}
          </p>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[180px]">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
            <span className="text-[12px] text-muted-foreground shrink-0">
              {done}/{total} modules
            </span>
          </div>
        </div>

        <div className="shrink-0 mt-1 text-muted-foreground">
          {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </div>
      </button>

      {open && !locked && (
        <div className="border-t border-border divide-y divide-border">
          {path.modules.map((mod, idx) => (
            <Link key={mod.id} href={`/app/coach/education/module/${mod.id}`}>
              <div className="flex items-center gap-3 px-5 py-3 hover:bg-accent/30 transition-colors cursor-pointer">
                <span className="text-[11px] text-muted-foreground font-mono w-6 shrink-0">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                {mod.status === "complete" ? (
                  <CheckCircle2 className="size-4 text-[oklch(0.75_0.12_140)] shrink-0" />
                ) : (
                  <Circle className="size-4 text-muted-foreground shrink-0 opacity-40" />
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[13px] font-medium truncate ${
                      mod.status === "complete" ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {mod.title}
                  </p>
                  <CategoryBadge category={mod.domain} />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" /> {mod.estimatedMinutes}m
                  </span>
                  <ChevronRight className="size-3.5 text-muted-foreground" />
                </div>
              </div>
            </Link>
          ))}

          <div className="px-5 py-4">
            <div className="flex items-center gap-2">
              <Award className="size-4 text-[oklch(0.78_0.16_75)]" />
              <p className="text-[12px] text-muted-foreground">
                Credential:{" "}
                <span className="font-medium text-foreground">{path.credentialTitle}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {open && locked && (
        <div className="border-t border-border p-5">
          <p className="text-[13px] text-muted-foreground flex items-center gap-2">
            <Lock className="size-4 shrink-0" />
            Complete Level {path.level - 1} curriculum to unlock this path.
          </p>
        </div>
      )}
    </div>
  );
}

function PathsOverview() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6">
        <PageHeader
          eyebrow="COACHING EDUCATION"
          title="Learning Paths"
          subtitle="Three levels. One system. Build your coaching practice from Foundation to Elite."
        />
        <div className="space-y-4">
          {learningPaths.map((path, i) => (
            <PathCard
              key={path.id}
              path={path}
              locked={i > 0}
              defaultOpen={i === 0}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

// ─── Module Reader ─────────────────────────────────────────────────────────────

const SECTION_ICONS: Record<ModuleSection["type"], React.ReactNode> = {
  frame:   <GraduationCap className="size-4" />,
  concept: <Lightbulb className="size-4" />,
  examine: <BookOpen className="size-4" />,
  apply:   <Target className="size-4" />,
  reflect: <Pencil className="size-4" />,
};

const SECTION_COLORS: Record<ModuleSection["type"], string> = {
  frame:   "oklch(0.55 0.02 260)",
  concept: "oklch(0.72 0.18 290)",
  examine: "oklch(0.65 0.15 220)",
  apply:   "oklch(0.75 0.12 140)",
  reflect: "oklch(0.78 0.16 75)",
};

function SectionBlock({ section, active }: { section: ModuleSection; active: boolean }) {
  const color = SECTION_COLORS[section.type];
  const [reflectText, setReflectText] = useState("");
  const [reflectSaved, setReflectSaved] = useState(false);

  if (!active) return null;

  return (
    <div className="space-y-4">
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-lg"
        style={{ background: `color-mix(in oklch, ${color} 10%, transparent)` }}
      >
        <span style={{ color }}>{SECTION_ICONS[section.type]}</span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
            {section.type.charAt(0).toUpperCase() + section.type.slice(1)}
          </p>
          <h3 className="text-[15px] font-semibold leading-snug">{section.title}</h3>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="space-y-3">
          {(section.content ?? "").split("\n\n").filter(Boolean).map((para, i) => (
            <p key={i} className="text-[14px] leading-relaxed text-foreground">
              {para.split(/(\*\*[^*]+\*\*)/).map((chunk, j) =>
                chunk.startsWith("**") && chunk.endsWith("**") ? (
                  <strong key={j}>{chunk.slice(2, -2)}</strong>
                ) : (
                  chunk
                )
              )}
            </p>
          ))}
        </div>

        {section.type === "apply" && section.actionPrompt && (
          <div
            className="mt-4 flex items-start gap-3 p-4 rounded-lg border"
            style={{
              background: `color-mix(in oklch, ${color} 8%, transparent)`,
              borderColor: `color-mix(in oklch, ${color} 25%, transparent)`,
            }}
          >
            <Target className="size-4 mt-0.5 shrink-0" style={{ color }} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color }}>
                Platform Action
              </p>
              <p className="text-[13px] font-medium">{section.actionPrompt}</p>
            </div>
          </div>
        )}

        {section.type === "reflect" && (
          <div className="mt-4 space-y-3">
            {reflectSaved ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[oklch(0.75_0.12_140_/_0.1)] border border-[oklch(0.75_0.12_140_/_0.3)]">
                <CheckCircle2 className="size-4 text-[oklch(0.75_0.12_140)]" />
                <p className="text-[13px] text-[oklch(0.75_0.12_140)]">
                  Reflection saved to your coaching journal.
                </p>
              </div>
            ) : (
              <>
                <Textarea
                  value={reflectText}
                  onChange={(e) => setReflectText(e.target.value)}
                  placeholder="Write your reflection here..."
                  className="min-h-[100px] text-[14px] resize-none"
                />
                <Button
                  size="sm"
                  disabled={!reflectText.trim()}
                  onClick={() => {
                    setReflectSaved(true);
                    toast.success("Reflection saved to journal.");
                  }}
                >
                  Save reflection
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ModuleReader({ module }: { module: EducationModule }) {
  const [, navigate] = useLocation();
  const [activeIdx, setActiveIdx] = useState(0);
  const [completed, setCompleted] = useState(!!module.completedAt);

  const sections = module.sections;
  const isLast = activeIdx === sections.length - 1;
  const path = learningPaths.find((p) => p.id === module.pathId || p.coachLevel === module.path);
  const moduleIdx = path ? path.modules.findIndex((m) => m.id === module.id) : -1;
  const moduleNum = moduleIdx >= 0 ? moduleIdx + 1 : module.order ?? "—";

  function handleComplete() {
    setCompleted(true);
    const deliverable = module.platformDeliverable ?? module.deliverablePrompt;
    toast.success(`Module complete! Deliverable: ${deliverable}`);
    setTimeout(() => navigate("/app/coach/education/paths"), 2000);
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6">
        <PageHeader
          eyebrow={`${(path?.title ?? "Foundation Path").toUpperCase()} · MODULE ${moduleNum}`}
          title={module.title}
          subtitle={module.subtitle}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          <aside className="hidden lg:block">
            <div className="rounded-xl border border-border bg-card p-4 sticky top-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Sections
              </p>
              <div className="space-y-1">
                {sections.map((sec, i) => {
                  const color = SECTION_COLORS[sec.type];
                  const isActive = i === activeIdx;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => setActiveIdx(i)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors"
                      style={
                        isActive
                          ? { background: `color-mix(in oklch, ${color} 12%, transparent)` }
                          : {}
                      }
                    >
                      <span
                        className="size-4 flex items-center justify-center"
                        style={{ color: isActive ? color : "oklch(0.55 0.02 260)" }}
                      >
                        {SECTION_ICONS[sec.type]}
                      </span>
                      <span
                        className="text-[12px] font-medium"
                        style={{ color: isActive ? color : undefined }}
                      >
                        {sec.type.charAt(0).toUpperCase() + sec.type.slice(1)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Clock className="size-3.5" />
                  {module.estimatedMinutes} min total
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-6 min-w-0">
            {sections.map((sec, i) => (
              <SectionBlock key={sec.id} section={sec} active={i === activeIdx} />
            ))}

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                disabled={activeIdx === 0}
                className="gap-1.5"
              >
                <ArrowLeft className="size-4" /> Previous
              </Button>

              {isLast ? (
                completed ? (
                  <div className="flex items-center gap-2 text-[oklch(0.75_0.12_140)]">
                    <CheckCircle2 className="size-4" />
                    <span className="text-[13px] font-medium">Module complete</span>
                  </div>
                ) : (
                  <Button onClick={handleComplete} className="gap-1.5">
                    <Award className="size-4" /> Mark Complete
                  </Button>
                )
              ) : (
                <Button
                  size="sm"
                  onClick={() => setActiveIdx((i) => Math.min(sections.length - 1, i + 1))}
                  className="gap-1.5"
                >
                  Next <ArrowRight className="size-4" />
                </Button>
              )}
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Platform Deliverable
              </p>
              <p className="text-[13px] text-foreground">{module.platformDeliverable ?? module.deliverablePrompt}</p>
              <Link href="/app/coach">
                <button className="mt-2 text-[12px] text-primary hover:underline flex items-center gap-1">
                  Go to platform <PlayCircle className="size-3.5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────────

export default function LearningPathPage() {
  const params = useParams<{ id?: string }>();
  const moduleId = params?.id;

  if (moduleId) {
    const module = getModule(moduleId);
    if (!module) {
      return (
        <AppShell>
          <div className="max-w-xl mx-auto px-4 py-16 text-center">
            <p className="text-muted-foreground">Module not found.</p>
            <Link href="/app/coach/education/paths">
              <Button variant="outline" size="sm" className="mt-4">
                Back to paths
              </Button>
            </Link>
          </div>
        </AppShell>
      );
    }
    return <ModuleReader module={module} />;
  }

  return <PathsOverview />;
}
