import { Link, useRoute, useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import {
  Users,
  ListChecks,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Play,
  MessageSquare,
  Film,
  ClipboardList,
  Calendar,
  Package,
  Radio,
  BookOpen,
  CreditCard,
  Shield,
  Flag,
  Database,
  Activity,
  Mail,
  Send,
  ChevronRight,
  Star,
  TrendingUp,
  DollarSign,
  Eye,
  UserCheck,
  AlertOctagon,
  Sparkles,
  ArrowRight,
  Trophy,
  Lock,
  Heart,
  Search,
  Zap,
  CheckCheck,
  Phone,
  UserPlus,
  MessageCircle,
} from "lucide-react";
import { useRef } from "react";
import { Stage, Layer, Circle, Line, Text as KonvaText, Rect } from "react-konva";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { ClipActionBar } from "@/components/film/ClipActionBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api/client";
import {
  org,
  roster,
  parentContacts,
  athleteUploads,
  filmRoom,
  clipTimestampComments,
  playbook,
  horsFlexFrames,
  experts,
  expertOffers,
  courses,
  liveEvents,
  plans,
  notifications,
  auditLog,
  moderationQueue,
  todaysWod,
} from "@/lib/mock/data";
import { demoUsers, ROLE_META } from "@/lib/mock/users";
import {
  courses as educationCourses,
  getCourse,
  CATEGORY_LABELS,
  LEVEL_LABELS,
  type LessonBlock,
} from "@/features/coach-education/education";

/* ==========================================================================
   Shared primitives
   ========================================================================== */

function StatCard({
  label,
  value,
  trend,
  icon,
  accent = "default",
}: {
  label: string;
  value: React.ReactNode;
  trend?: string;
  icon?: React.ReactNode;
  accent?: "default" | "primary" | "indigo" | "success" | "danger";
}) {
  const colors = {
    default: "text-muted-foreground",
    primary: "text-primary",
    indigo: "text-[oklch(0.72_0.18_290)]",
    success: "text-[oklch(0.75_0.18_150)]",
    danger: "text-[oklch(0.68_0.22_25)]",
  };
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
          {label}
        </div>
        {icon && <div className={colors[accent]}>{icon}</div>}
      </div>
      <div className="display text-3xl leading-none">{value}</div>
      {trend && <div className="text-[12px] text-muted-foreground mt-2">{trend}</div>}
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="display text-xl">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

/* ==========================================================================
   COACH HQ
   ========================================================================== */

export { CoachDashboard } from "./coach/CoachDashboard";

export function CoachRoster() {
  const [search, setSearch] = useState("");
  const filtered = roster.filter(
    (a) =>
      !search.trim() ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.phone ?? "").includes(search) ||
      (a.email ?? "").toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Coach HQ · Roster"
          title="Texas Elite Varsity"
          subtitle="12 athletes · 2025–2026 season"
          actions={
            <div className="flex items-center gap-2">
              <Link href="/app/coach/parents" asChild>
                <a className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border text-[12.5px] font-semibold hover:bg-muted transition">
                  <Heart className="w-4 h-4" /> Parents
                </a>
              </Link>
              <button className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-[12.5px] uppercase tracking-[0.08em] hover:brightness-110 transition">
                <Mail className="w-4 h-4" /> Invite Athlete
              </button>
            </div>
          }
        />

        {/* Search */}
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, email…"
            className="w-full pl-9 pr-4 h-9 rounded-md border border-border bg-card text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left">
                <Th>Athlete</Th>
                <Th>Phone</Th>
                <Th>Pos</Th>
                <Th>HT</Th>
                <Th>Class</Th>
                <Th>Lvl</Th>
                <Th>XP</Th>
                <Th>Streak</Th>
                <Th>Today</Th>
                <Th>Last Active</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-border last:border-0 hover:bg-muted/40 transition"
                >
                  <Td>
                    <Link href={`/app/coach/players/${a.id}`} asChild>
                      <a className="flex items-center gap-2.5 hover:opacity-80 transition">
                        <div className="w-7 h-7 rounded-md bg-primary/15 text-primary font-semibold text-[11px] flex items-center justify-center shrink-0">
                          {a.initials}
                        </div>
                        <div>
                          <div className="font-medium whitespace-nowrap hover:underline underline-offset-2">{a.name}</div>
                          {a.isMinor ? (
                            <div className="text-[10.5px] text-muted-foreground">Minor · parent linked</div>
                          ) : a.email ? (
                            <div className="text-[10.5px] text-muted-foreground truncate max-w-[140px]">{a.email}</div>
                          ) : null}
                        </div>
                      </a>
                    </Link>
                  </Td>
                  <Td>
                    {a.phone ? (
                      <a href={`tel:${a.phone}`} className="font-mono text-[12px] text-muted-foreground hover:text-foreground transition whitespace-nowrap">
                        {a.phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </Td>
                  <Td>{a.position}</Td>
                  <Td className="whitespace-nowrap">{a.height}</Td>
                  <Td>'{a.classYear.toString().slice(2)}</Td>
                  <Td><span className="font-mono">{a.level}</span></Td>
                  <Td className="font-mono">{a.xp.toLocaleString()}</Td>
                  <Td>
                    <span className="inline-flex items-center gap-1">
                      🔥 <span className="font-mono">{a.streak}</span>
                    </span>
                  </Td>
                  <Td>
                    <ComplianceChip value={a.compliance} />
                  </Td>
                  <Td className="text-muted-foreground whitespace-nowrap">{a.lastActive}</Td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-[13px] text-muted-foreground">
                    No athletes match "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

/* -------------------------------------------------------------------------- */
/* CoachParents                                                                */
/* -------------------------------------------------------------------------- */

export function CoachParents() {
  const [search, setSearch] = useState("");
  const [filterMinors, setFilterMinors] = useState(false);

  const minorIds = new Set(roster.filter((a) => a.isMinor).map((a) => a.id));

  const contacts = parentContacts.filter((p) => {
    if (filterMinors && !minorIds.has(p.athleteId)) return false;
    if (!search.trim()) return true;
    const athlete = roster.find((a) => a.id === p.athleteId);
    return (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search) ||
      (p.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (athlete?.name ?? "").toLowerCase().includes(search.toLowerCase())
    );
  });

  // Group by athlete
  const byAthlete = roster
    .filter((a) => (filterMinors ? a.isMinor : true))
    .map((a) => ({
      athlete: a,
      parents: contacts.filter((p) => p.athleteId === a.id),
    }))
    .filter((row) => (search.trim() ? row.parents.length > 0 : true));

  const totalContacts = parentContacts.length;
  const minorCount = roster.filter((a) => a.isMinor).length;

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Coach HQ · Roster"
          title="Parent &amp; Guardian Contacts"
          subtitle={`${totalContacts} contacts across ${minorCount} minor athletes`}
          actions={
            <div className="flex items-center gap-2">
              <Link href="/app/coach/roster" asChild>
                <a className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border text-[12.5px] font-semibold hover:bg-muted transition">
                  <Users className="w-4 h-4" /> Roster
                </a>
              </Link>
              <button className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-[12.5px] uppercase tracking-[0.08em] hover:brightness-110 transition">
                <UserPlus className="w-4 h-4" /> Add Contact
              </button>
            </div>
          }
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, or athlete…"
              className="w-full pl-9 pr-4 h-9 rounded-md border border-border bg-card text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            onClick={() => setFilterMinors(!filterMinors)}
            className={`h-9 px-4 rounded-md text-[12.5px] font-medium border transition ${
              filterMinors
                ? "bg-primary/10 border-primary text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Minors only
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total contacts", value: totalContacts },
            { label: "Minor athletes", value: minorCount },
            { label: "SMS enabled", value: parentContacts.filter((p) => p.canReceiveMessages).length },
            { label: "Primary contacts", value: parentContacts.filter((p) => p.isPrimary).length },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-1">{s.label}</div>
              <div className="text-2xl font-display">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Athlete groups */}
        <div className="space-y-4">
          {byAthlete.length === 0 && (
            <div className="text-center py-12 text-[13px] text-muted-foreground">
              No contacts match your search.
            </div>
          )}
          {byAthlete.map(({ athlete, parents }) => (
            <div key={athlete.id} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Athlete header */}
              <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-primary/15 text-primary font-semibold text-[11px] flex items-center justify-center shrink-0">
                  {athlete.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13.5px]">{athlete.name}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {athlete.position} · '{athlete.classYear.toString().slice(2)} · {athlete.phone ?? "no athlete phone"}
                  </div>
                </div>
                <span className="text-[10.5px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {parents.length} contact{parents.length !== 1 ? "s" : ""}
                </span>
              </div>

              {parents.length === 0 ? (
                <div className="px-4 py-4 text-[12.5px] text-muted-foreground italic">
                  No parent contacts on file.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {parents.map((p) => (
                    <div key={p.id} className="px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                      {/* Name + relationship */}
                      <div className="flex items-center gap-2.5 min-w-[180px]">
                        <div
                          className="w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-semibold shrink-0"
                          style={{ background: "oklch(0.55 0.18 280 / 0.15)", color: "oklch(0.75 0.18 280)" }}
                        >
                          {p.initials}
                        </div>
                        <div>
                          <div className="font-medium text-[13px]">{p.name}</div>
                          <div className="text-[10.5px] text-muted-foreground flex items-center gap-1.5">
                            <span>{p.relationship}</span>
                            {p.isPrimary && (
                              <span className="inline-block px-1 py-px rounded bg-primary/10 text-primary text-[9px] font-mono uppercase tracking-wider">
                                Primary
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="flex items-center gap-1.5 min-w-[160px]">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <a
                          href={`tel:${p.phone}`}
                          className="font-mono text-[12.5px] hover:text-primary transition"
                        >
                          {p.phone}
                        </a>
                      </div>

                      {/* Email */}
                      {p.email ? (
                        <div className="flex items-center gap-1.5 min-w-[200px]">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <a
                            href={`mailto:${p.email}`}
                            className="text-[12.5px] text-muted-foreground hover:text-foreground transition truncate"
                          >
                            {p.email}
                          </a>
                        </div>
                      ) : (
                        <div className="min-w-[200px]" />
                      )}

                      {/* Flags */}
                      <div className="flex items-center gap-2 ml-auto">
                        {p.canReceiveMessages && (
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            <MessageCircle className="w-3 h-3" /> SMS on
                          </span>
                        )}
                        {p.notes && (
                          <span className="text-[11px] text-muted-foreground italic">{p.notes}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-[11px] uppercase tracking-[0.1em] font-mono text-muted-foreground font-normal">
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
function ComplianceChip({ value }: { value: number }) {
  const cls =
    value === 100
      ? "bg-[oklch(0.55_0.18_150)]/15 text-[oklch(0.75_0.18_150)]"
      : value >= 70
        ? "bg-[oklch(0.72_0.17_75)]/15 text-[oklch(0.82_0.17_75)]"
        : value >= 40
          ? "bg-[oklch(0.68_0.2_60)]/15 text-[oklch(0.8_0.2_60)]"
          : "bg-[oklch(0.55_0.2_25)]/15 text-[oklch(0.75_0.2_25)]";
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10.5px] font-mono ${cls}`}>
      {value}%
    </span>
  );
}

export function CoachQueue() {
  const [totalOpen, setTotalOpen] = useState(0);

  useEffect(() => {
    apiGet<{ id: string }[]>("/coaching-actions/open")
      .then((actions) => { if (Array.isArray(actions)) setTotalOpen(actions.length); })
      .catch(() => { /* demo mode — no badge */ });
  }, []);

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Coach HQ · Review Queue"
          title="Video Review Queue"
          subtitle={
            totalOpen > 0
              ? `Sorted by AI priority — flagged clips at top. ${totalOpen} open coaching action${totalOpen === 1 ? "" : "s"} pending.`
              : "Sorted by AI priority — flagged clips at top. Telestrate, comment, mark reviewed."
          }
        />
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {athleteUploads.map((u) => (
            <Link key={u.id} href={`/app/coach/queue/${u.id}`} asChild>
              <a className="flex items-center gap-4 p-4 hover:bg-muted/40 transition">
                <div className="w-32 h-20 rounded-md bg-[oklch(0.15_0.005_260)] flex items-center justify-center text-muted-foreground">
                  <Film className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-[14px] truncate">{u.title}</span>
                    {u.status === "LOW_CONFIDENCE" && (
                      <span className="px-1.5 py-0.5 rounded-sm bg-[oklch(0.55_0.2_25)]/15 text-[oklch(0.75_0.2_25)] text-[10px] font-mono uppercase tracking-wider">
                        Escalated
                      </span>
                    )}
                    {u.status === "READY" && (
                      <span className="px-1.5 py-0.5 rounded-sm bg-primary/15 text-primary text-[10px] font-mono uppercase tracking-wider">
                        Ready
                      </span>
                    )}
                    {u.status === "COACH_REVIEWED" && (
                      <span className="px-1.5 py-0.5 rounded-sm bg-[oklch(0.55_0.18_150)]/15 text-[oklch(0.75_0.18_150)] text-[10px] font-mono uppercase tracking-wider">
                        Reviewed
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-muted-foreground flex items-center gap-3">
                    <span>{u.uploadedAt}</span>
                    <span>·</span>
                    <span>{u.duration}</span>
                    <span>·</span>
                    <span className="font-mono">AI conf {(u.aiConfidence * 100).toFixed(0)}%</span>
                    <span>·</span>
                    <span>{u.issues.length} observations</span>
                    {u.openActionCount != null && u.openActionCount > 0 && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-[oklch(0.68_0.22_25)]/15 text-[oklch(0.75_0.22_25)] text-[10px] font-mono">
                          {u.openActionCount} open {u.openActionCount === 1 ? "action" : "actions"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </a>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export function CoachQueueDetail() {
  const [, params] = useRoute("/app/coach/queue/:id");
  const upload = athleteUploads.find((u) => u.id === params?.id) ?? athleteUploads[0];
  const [activeT, setActiveT] = useState<string | null>(upload.issues[0]?.timestamp ?? null);
  // Track which issues have been expanded to show their action bar
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);
  // Track fully reviewed state
  const [isReviewed, setIsReviewed] = useState(upload.status === "COACH_REVIEWED");
  const [addressedIssues, setAddressedIssues] = useState<Set<number>>(new Set());
  const [commentText, setCommentText] = useState("");

  const allAddressed = upload.issues.length > 0 && addressedIssues.size === upload.issues.length;

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1600px] mx-auto">
        <Link href="/app/coach/queue" asChild>
          <a className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
            ← Review Queue
          </a>
        </Link>
        <PageHeader
          eyebrow={`Clip · ${upload.status.replace("_", " ")}`}
          title={upload.title}
          subtitle={`${upload.uploadedAt} · ${upload.duration} · AI confidence ${(upload.aiConfidence * 100).toFixed(0)}% · ${upload.issues.length} observations`}
          actions={
            <button
              onClick={() => { setIsReviewed(true); }}
              className={`inline-flex items-center gap-2 h-9 px-4 rounded-md font-semibold text-[12.5px] uppercase tracking-[0.08em] transition ${
                isReviewed
                  ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 cursor-default"
                  : "bg-primary text-primary-foreground hover:brightness-110"
              }`}
            >
              <CheckCheck className="w-4 h-4" />
              {isReviewed ? "Reviewed" : "Mark Reviewed"}
            </button>
          }
        />

        {/* Progress strip — shows how many issues have actions */}
        {upload.issues.length > 0 && (
          <div className="mb-6 rounded-lg border border-border bg-card px-4 py-3 flex items-center gap-4">
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>
                <span className="font-semibold text-foreground">{addressedIssues.size}</span>
                /{upload.issues.length} observations actioned
              </span>
            </div>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${upload.issues.length > 0 ? (addressedIssues.size / upload.issues.length) * 100 : 0}%` }}
              />
            </div>
            {allAddressed && (
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All actioned
              </span>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_420px] gap-6">
          {/* Left: Video + telestration + coach comment */}
          <div>
            <TelestrationCanvas activeTimestamp={activeT} />

            <div className="mt-5 rounded-xl border border-border bg-card p-5">
              <div className="text-[11px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-2">
                Coach Comment · Timestamped
              </div>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full bg-transparent border border-border rounded-md p-3 text-[13px] resize-none focus:outline-none focus:border-primary"
                rows={3}
                placeholder={`[${activeT ?? "0:00"}] Type your feedback here. Auto-prepends timestamp.`}
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Heart className="w-3 h-3" /> Auto-cc parent on minor athletes
                </div>
                <button
                  onClick={() => { setCommentText(""); }}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-[12px] font-semibold"
                >
                  <Send className="w-3 h-3" /> Send
                </button>
              </div>
            </div>
          </div>

          {/* Right: AI observations with action bars + coach review */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-[13px] font-semibold">AI Observations</span>
                <span className="ml-auto text-[10px] font-mono text-muted-foreground">
                  Model v2.1
                </span>
              </div>

              <div className="divide-y divide-border">
                {upload.issues.map((issue, i) => {
                  const isActive    = activeT === issue.timestamp;
                  const isExpanded  = expandedIssue === i;
                  const isActioned  = addressedIssues.has(i);

                  return (
                    <div
                      key={i}
                      className={`transition-colors ${isActive ? "bg-primary/5" : ""} ${isActioned ? "opacity-60" : ""}`}
                    >
                      {/* Observation header — click to seek */}
                      <button
                        onClick={() => {
                          setActiveT(issue.timestamp);
                          setExpandedIssue(isExpanded ? null : i);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-muted/40 transition"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="font-mono text-[11px] text-primary shrink-0 mt-0.5">
                            {issue.timestamp}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className="text-[11.5px] font-semibold uppercase tracking-wider">
                                {issue.category}
                              </span>
                              {issue.severity === "major" ? (
                                <AlertOctagon className="w-3 h-3 text-[oklch(0.7_0.2_30)]" />
                              ) : (
                                <AlertTriangle className="w-3 h-3 text-muted-foreground" />
                              )}
                              {isActioned && (
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 ml-auto" />
                              )}
                            </div>
                            <div className="text-[12.5px] leading-relaxed text-muted-foreground">
                              {issue.message}
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Inline action bar — expands without a modal */}
                      {isExpanded && !isActioned && (
                        <div className="px-4 pb-4 pt-1 bg-muted/20 border-t border-border/50">
                          <ClipActionBar
                            sessionId={upload.id}
                            timestamp={issue.timestamp}
                            issueCategory={issue.category}
                            issueSeverity={issue.severity}
                            onActionCreated={() => {
                              setAddressedIssues((prev) => new Set(Array.from(prev).concat(i)));
                              setExpandedIssue(null);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="px-4 py-3 border-t border-border text-[11px] text-muted-foreground">
                <em>AI feedback is preliminary. Coach review is canonical.</em>
              </div>
            </div>

            {upload.coachReview && (
              <div className="rounded-xl border border-border bg-card">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[oklch(0.72_0.18_290)]" />
                  <span className="text-[13px] font-semibold">
                    {upload.coachReview.coachName}'s Review
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-[13px] leading-relaxed italic text-muted-foreground">
                    "{upload.coachReview.verdict}"
                  </p>
                  {upload.coachReview.comments.map((c, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="font-mono text-[11px] text-primary shrink-0 mt-0.5">
                        {c.t}
                      </span>
                      <span className="text-[12.5px]">{c.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function TelestrationCanvas({ activeTimestamp }: { activeTimestamp: string | null }) {
  return (
    <div className="rounded-xl border border-border bg-[oklch(0.1_0.005_260)] overflow-hidden aspect-video relative">
      {/* Mock "video frame" */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 30% 40%, oklch(0.28 0.06 260) 0%, oklch(0.12 0.005 260) 70%)",
        }}
      />
      {/* Court lines mock */}
      <svg
        viewBox="0 0 800 450"
        className="absolute inset-0 w-full h-full text-muted-foreground/30"
      >
        <line x1="400" y1="0" x2="400" y2="450" stroke="currentColor" strokeWidth="1" />
        <circle cx="400" cy="225" r="60" stroke="currentColor" strokeWidth="1" fill="none" />
      </svg>
      {/* Telestration overlay */}
      <svg viewBox="0 0 800 450" className="absolute inset-0 w-full h-full pointer-events-none">
        <circle cx="270" cy="180" r="32" stroke="oklch(0.78 0.17 75)" strokeWidth="3" fill="none" />
        <path
          d="M 270 180 Q 370 100 500 160"
          stroke="oklch(0.78 0.17 75)"
          strokeWidth="2.5"
          fill="none"
          strokeDasharray="6 3"
        />
        <polygon points="500,160 490,152 490,168" fill="oklch(0.78 0.17 75)" />
      </svg>
      {/* HUD */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
        <button className="w-10 h-10 rounded-full bg-black/70 backdrop-blur flex items-center justify-center text-white hover:bg-black/90 transition">
          <Play className="w-4 h-4" fill="currentColor" />
        </button>
        <div className="flex-1 h-1 rounded-full bg-white/20 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-[38%] bg-primary" />
          {/* Comment markers */}
          {[14, 37, 69].map((t, i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary"
              style={{ left: `${(t / 102) * 100}%` }}
            />
          ))}
        </div>
        <div className="font-mono text-[11px] text-white/80 bg-black/50 px-2 py-1 rounded">
          {activeTimestamp ?? "0:38"} / 1:42
        </div>
      </div>
      {/* Tools */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {["→", "○", "✕", "∿"].map((t, i) => (
          <button
            key={i}
            className="w-9 h-9 rounded-md bg-black/60 backdrop-blur text-white hover:bg-primary hover:text-black transition font-semibold"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CoachAssignments() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Coach HQ"
          title="Assignment Composer"
          subtitle="Assign workouts, drills, film, quizzes. Recurrence, group targeting, auto-notify."
        />
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-5">
            <Field label="Type" required>
              <div className="grid grid-cols-4 gap-2">
                {["Workout", "Drill", "Film Clip", "Quiz"].map((t) => (
                  <button
                    key={t}
                    className="h-10 rounded-md border border-border text-[13px] hover:border-primary hover:bg-primary/5 transition"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Title" required>
              <input
                className="w-full bg-transparent border border-border rounded-md h-10 px-3 text-[13px] focus:outline-none focus:border-primary"
                defaultValue="Pull-up Jumper Sharpening"
              />
            </Field>
            <Field label="Description">
              <textarea
                rows={3}
                className="w-full bg-transparent border border-border rounded-md p-3 text-[13px] resize-none focus:outline-none focus:border-primary"
                defaultValue="Three-round circuit. Focus on balance before release. Submit video of last set."
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Due Date" required>
                <input
                  type="date"
                  className="w-full bg-transparent border border-border rounded-md h-10 px-3 text-[13px] focus:outline-none focus:border-primary"
                />
              </Field>
              <Field label="Recurrence">
                <select className="w-full bg-transparent border border-border rounded-md h-10 px-3 text-[13px] focus:outline-none focus:border-primary">
                  <option>One time</option>
                  <option>Daily</option>
                  <option>3x / week</option>
                  <option>Weekly</option>
                </select>
              </Field>
            </div>
            <Field label="Assign To" required>
              <div className="flex flex-wrap gap-2">
                <Chip selected>Full Team · 12</Chip>
                <Chip>Guards · 5</Chip>
                <Chip>Wings · 3</Chip>
                <Chip>Bigs · 4</Chip>
                <Chip>Juniors · 5</Chip>
                <Chip>Underclassmen · 7</Chip>
              </div>
            </Field>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 h-fit sticky top-6">
            <h4 className="display text-[16px] mb-3">Preview</h4>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-5">
              Athletes will receive an in-app notification + email. Parents of minor athletes auto-cc'd.
            </p>
            <button className="w-full h-11 rounded-md bg-primary text-primary-foreground font-semibold text-[13px] uppercase tracking-[0.08em] hover:brightness-110 transition">
              Assign to 12 Athletes
            </button>
            <button className="w-full mt-2 h-11 rounded-md border border-border text-[12.5px] hover:bg-muted transition">
              Save as Template
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-1.5">
        {label} {required && <span className="text-primary">*</span>}
      </div>
      {children}
    </label>
  );
}
function Chip({
  children,
  selected,
}: {
  children: React.ReactNode;
  selected?: boolean;
}) {
  return (
    <button
      className={`h-8 px-3 rounded-full text-[12px] border transition ${
        selected
          ? "bg-primary/15 border-primary text-primary"
          : "border-border hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}

export function CoachPracticePlans() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Coach HQ"
          title="Practice Plan Builder"
          subtitle="Drag-drop blocks. Time budget enforced. Export to PDF for staff."
          actions={
            <button className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-[12.5px] uppercase tracking-[0.08em] hover:brightness-110 transition">
              New Plan
            </button>
          }
        />
        <div className="grid lg:grid-cols-[240px_1fr] gap-6">
          <div className="rounded-xl border border-border bg-card p-4 h-fit">
            <div className="text-[11px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-3">
              Block Library
            </div>
            <div className="space-y-2">
              {[
                { t: "Warm-up", d: "10 min", c: "oklch(0.7 0.18 190)" },
                { t: "Skill Block", d: "15 min", c: "oklch(0.72 0.17 75)" },
                { t: "5v5 Sets", d: "20 min", c: "oklch(0.72 0.18 290)" },
                { t: "Conditioning", d: "10 min", c: "oklch(0.7 0.2 30)" },
                { t: "Film Review", d: "10 min", c: "oklch(0.7 0.14 140)" },
                { t: "Free Throws", d: "5 min", c: "oklch(0.75 0.12 240)" },
              ].map((b) => (
                <div
                  key={b.t}
                  className="p-3 rounded-md border border-border cursor-grab hover:bg-muted transition"
                  draggable
                >
                  <div
                    className="w-1 h-4 inline-block mr-2 align-middle rounded-full"
                    style={{ background: b.c }}
                  />
                  <span className="text-[13px] font-medium">{b.t}</span>
                  <div className="text-[11px] text-muted-foreground mt-0.5 ml-3">
                    Default {b.d}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-baseline justify-between mb-5">
              <div>
                <div className="text-[11px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-1">
                  Plan · Thu Oct 24
                </div>
                <h3 className="display text-xl">Pre-Westbury Sharpening</h3>
              </div>
              <div className="text-[12px] font-mono text-muted-foreground">
                Budget: 90 min · Scheduled: <span className="text-primary">85 min</span>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { t: "Dynamic Warm-up", d: 10, c: "oklch(0.7 0.18 190)", note: "Full-court layup lines + hip openers" },
                { t: "Shooting Circuit", d: 15, c: "oklch(0.72 0.17 75)", note: "Pull-ups · catch-shoot · floater" },
                { t: "Pick & Roll Coverage — Ice", d: 20, c: "oklch(0.72 0.18 290)", note: "vs. Westbury's side PnR sets" },
                { t: "Zone Offense Setup", d: "15", c: "oklch(0.72 0.18 290)", note: "4-out vs 2-3" },
                { t: "Full-court 5v5", d: 15, c: "oklch(0.7 0.2 30)", note: "Live → scripted" },
                { t: "Free Throws", d: 10, c: "oklch(0.75 0.12 240)", note: "50 in a row · no misses break" },
              ].map((b, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-md border border-border hover:border-primary/50 transition"
                >
                  <div
                    className="w-1 h-10 rounded-full"
                    style={{ background: b.c }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium">{b.t}</div>
                    <div className="text-[11.5px] text-muted-foreground">{b.note}</div>
                  </div>
                  <div className="font-mono text-[12px] text-muted-foreground">
                    {b.d} min
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export function CoachBookings() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Coach HQ"
          title="My Bookings"
          subtitle="Manage your marketplace consults, check earnings, prep for sessions."
        />
        <div className="grid md:grid-cols-3 gap-3 mb-8">
          <StatCard label="Upcoming" value="3" accent="primary" icon={<Calendar className="w-4 h-4" />} />
          <StatCard label="MTD Earnings" value="$1,420" accent="success" icon={<DollarSign className="w-4 h-4" />} />
          <StatCard label="Rating" value="4.94" trend="54 reviews" icon={<Star className="w-4 h-4" />} />
        </div>
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          No bookings this week. <Link href="/app/marketplace" asChild><a className="text-primary hover:underline">Browse the marketplace →</a></Link>
        </div>
      </div>
    </AppShell>
  );
}

/* ==========================================================================
   TEAM / ORG ADMIN
   ========================================================================== */

export { TeamDashboard } from "./team/TeamDashboard";

export function TeamInvite() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[820px] mx-auto">
        <PageHeader
          eyebrow="Team Management"
          title="Invite to Texas Elite"
          subtitle="Share a single join link, or send individual emails. Role assigned at acceptance."
        />
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <div className="text-[11px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-2">
            Magic Invite Link
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 h-10 px-3 rounded-md bg-[oklch(0.15_0.005_260)] flex items-center text-[12px] font-mono text-muted-foreground overflow-x-auto">
              https://hoopsiq.com/join/tx-elite-varsity-7f4a2
            </code>
            <button className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-[12px] font-semibold">
              Copy
            </button>
          </div>
          <div className="mt-3 text-[12px] text-muted-foreground">
            Anyone with this link can request to join · expires in 7 days
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="text-[11px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-2">
            Email Invites
          </div>
          <textarea
            rows={5}
            className="w-full bg-transparent border border-border rounded-md p-3 text-[13px] resize-none focus:outline-none focus:border-primary font-mono"
            placeholder="jalen@email.com&#10;marcus@email.com&#10;deandre@email.com"
          />
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px]">
              <span className="text-muted-foreground">Assign role:</span>
              <select className="h-8 px-2 rounded-md border border-border bg-transparent text-[12px]">
                <option>Athlete</option>
                <option>Assistant Coach</option>
                <option>Trainer</option>
              </select>
            </div>
            <button className="h-10 px-5 rounded-md bg-primary text-primary-foreground font-semibold text-[12.5px] uppercase tracking-[0.08em]">
              Send 0 Invites
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export function TeamBilling() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1000px] mx-auto">
        <PageHeader
          eyebrow="Team Management"
          title="Billing & Seats"
          subtitle="Team Pro · 25 seats · billed monthly · next invoice Nov 12"
        />
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-1">
                Current Plan
              </div>
              <h3 className="display text-2xl">Team Pro · Monthly</h3>
            </div>
            <div className="text-right">
              <div className="display text-3xl">$247.50</div>
              <div className="text-[11.5px] text-muted-foreground">/ month · incl. tax</div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3 text-[12.5px]">
            <div className="p-3 rounded-md bg-[oklch(0.15_0.005_260)]">
              <div className="text-muted-foreground text-[11px] uppercase tracking-wider mb-1 font-mono">Seats</div>
              <div className="font-semibold">25 / 25 used</div>
            </div>
            <div className="p-3 rounded-md bg-[oklch(0.15_0.005_260)]">
              <div className="text-muted-foreground text-[11px] uppercase tracking-wider mb-1 font-mono">Athletes on 50%</div>
              <div className="font-semibold text-[oklch(0.75_0.18_150)]">12 active</div>
            </div>
            <div className="p-3 rounded-md bg-[oklch(0.15_0.005_260)]">
              <div className="text-muted-foreground text-[11px] uppercase tracking-wider mb-1 font-mono">Next Invoice</div>
              <div className="font-semibold">Nov 12, 2026</div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <button className="h-9 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-[12.5px] uppercase tracking-[0.08em]">
              Add Seats
            </button>
            <button className="h-9 px-4 rounded-md border border-border text-[12.5px]">
              Switch to Annual (save 16%)
            </button>
            <button className="ml-auto text-[12px] text-muted-foreground hover:text-destructive">
              Cancel plan
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="display text-[17px]">Invoice History</h3>
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <Th>Date</Th>
                <Th>Description</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th> </Th>
              </tr>
            </thead>
            <tbody>
              {[
                { d: "Oct 12, 2026", desc: "Team Pro · 25 seats", amt: "$247.50", s: "Paid" },
                { d: "Sep 12, 2026", desc: "Team Pro · 20 seats", amt: "$198.00", s: "Paid" },
                { d: "Aug 12, 2026", desc: "Team Pro · 20 seats", amt: "$198.00", s: "Paid" },
              ].map((inv, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/40 transition">
                  <Td className="text-muted-foreground">{inv.d}</Td>
                  <Td>{inv.desc}</Td>
                  <Td>{inv.amt}</Td>
                  <Td>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-[oklch(0.55_0.18_150)]/15 text-[oklch(0.75_0.18_150)] text-[10.5px] font-mono uppercase tracking-wider">
                      {inv.s}
                    </span>
                  </Td>
                  <Td>
                    <button className="text-[12px] text-muted-foreground hover:text-foreground">
                      Download
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

/* ==========================================================================
   MARKETPLACE
   ========================================================================== */

export function MarketplaceHome() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Expert Marketplace"
          title="Train with legends."
          subtitle="NBA skill coaches, WNBA All-Stars, and performance specialists — on your schedule."
        />
        <div className="flex items-center gap-2 flex-wrap mb-6">
          {["All", "Shooting", "PG Development", "Big Man", "Scoring", "Defense", "Mental", "Performance"].map(
            (t, i) => (
              <button
                key={t}
                className={`h-8 px-3 rounded-full text-[12px] border transition ${
                  i === 0
                    ? "bg-primary/15 border-primary text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {t}
              </button>
            ),
          )}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {experts.map((e) => (
            <Link key={e.id} href={`/app/marketplace/${e.slug}`} asChild>
              <a className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition group">
                <div
                  className="h-48 relative"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, oklch(0.3 0.1 ${280 + e.id.charCodeAt(3)}) 0%, oklch(0.12 0.01 260) 100%)`,
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="display text-6xl text-white/90 group-hover:scale-110 transition">
                      {e.initials}
                    </div>
                  </div>
                  {e.verified && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-sm bg-primary/90 text-primary-foreground text-[10px] font-mono uppercase tracking-wider font-bold">
                      Verified
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1 text-[11px] uppercase tracking-[0.1em] font-mono text-muted-foreground">
                    {e.category}
                  </div>
                  <div className="display text-lg leading-tight mb-1">{e.name}</div>
                  <div className="text-[12.5px] text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                    {e.tagline}
                  </div>
                  <div className="flex items-center gap-3 text-[11.5px] text-muted-foreground font-mono">
                    <span className="flex items-center gap-1 text-[oklch(0.78_0.17_75)]">
                      <Star className="w-3 h-3" fill="currentColor" /> {e.rating}
                    </span>
                    <span>·</span>
                    <span>{e.reviewCount} reviews</span>
                    <span>·</span>
                    <span>~{e.responseHrs}h response</span>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export function MarketplaceProfile() {
  const [, params] = useRoute("/app/marketplace/:slug");
  const expert = experts.find((e) => e.slug === params?.slug) ?? experts[0];
  const offers = expertOffers.filter((o) => o.expertId === expert.id);
  const { user } = useAuth();
  const hasMembership = user?.role === "ATHLETE" || user?.role === "COACH";

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <Link href="/app/marketplace" asChild>
          <a className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
            ← Marketplace
          </a>
        </Link>

        {/* Cinematic hero */}
        <div
          className="relative rounded-2xl overflow-hidden mb-8 h-72 flex items-end"
          style={{
            background: `radial-gradient(circle at 30% 50%, oklch(0.35 0.15 280) 0%, oklch(0.1 0.01 260) 70%)`,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_40%,black/60)]" />
          <div className="relative p-8">
            <div className="flex items-end gap-5">
              <div className="w-28 h-28 rounded-xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center display text-4xl text-primary">
                {expert.initials}
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] font-mono text-primary mb-2">
                  {expert.category} · {expert.verified && "Verified Expert"}
                </div>
                <h1 className="display text-4xl lg:text-5xl leading-tight">{expert.name}</h1>
                <p className="text-[14px] text-muted-foreground mt-1">{expert.tagline}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div>
            <div className="flex items-center gap-6 mb-6 text-[13px]">
              <span className="flex items-center gap-1.5 text-[oklch(0.78_0.17_75)]">
                <Star className="w-4 h-4" fill="currentColor" /> {expert.rating}
                <span className="text-muted-foreground">({expert.reviewCount})</span>
              </span>
              <span className="text-muted-foreground">~{expert.responseHrs}h response time</span>
              <span className="text-muted-foreground">Based in Los Angeles, CA</span>
            </div>

            <h3 className="display text-xl mb-3">Bio</h3>
            <p className="text-[14px] leading-relaxed text-muted-foreground mb-8">{expert.bio}</p>

            <h3 className="display text-xl mb-3">Credentials</h3>
            <ul className="space-y-2 mb-8">
              {expert.credentials.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-[13.5px]">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {c}
                </li>
              ))}
            </ul>

            <h3 className="display text-xl mb-3">Offers ({offers.length})</h3>
            <div className="space-y-3">
              {offers.map((o: any) => (
                <div
                  key={o.id}
                  className="rounded-lg border border-border bg-card p-4 flex items-center gap-5 hover:border-primary/40 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-[0.1em] font-mono px-1.5 py-0.5 rounded-sm bg-primary/15 text-primary">
                        {o.type.replace("_", " ")}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{o.durationLabel}</span>
                    </div>
                    <div className="font-medium text-[14px]">{o.title}</div>
                    <div className="text-[12px] text-muted-foreground mt-1 line-clamp-2">
                      {o.description}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {hasMembership && (
                      <div className="text-[10px] text-[oklch(0.75_0.18_150)] font-mono uppercase tracking-wider mb-0.5">
                        Member
                      </div>
                    )}
                    <div className="display text-xl">
                      ${hasMembership ? o.memberPrice : o.publicPrice}
                    </div>
                    {hasMembership && (
                      <div className="text-[11px] line-through text-muted-foreground">
                        ${o.publicPrice}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sticky booking card */}
          <div className="sticky top-6 h-fit">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="text-[11px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-3">
                Book a Session
              </div>
              <div className="display text-3xl mb-1">${hasMembership ? 124 : 249}</div>
              <div className="text-[12px] text-muted-foreground mb-4">
                starting · async review
              </div>
              <button className="w-full h-11 rounded-md bg-primary text-primary-foreground font-semibold text-[13px] uppercase tracking-[0.08em] hover:brightness-110 transition mb-2">
                Book Now
              </button>
              <button className="w-full h-11 rounded-md border border-border text-[12.5px] hover:bg-muted transition">
                Message {expert.name.split(" ")[0]}
              </button>
              {!hasMembership && (
                <div className="mt-4 p-3 rounded-md bg-primary/10 text-[11.5px] leading-relaxed">
                  <strong className="text-primary">Save 50%+</strong> on every offer with a
                  Player Core or Coach Core membership.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ==========================================================================
   FILM ROOM
   ========================================================================== */

export function FilmRoomHome() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Film Room"
          title={filmRoom.name}
          subtitle="Game film, tagged clips, assignments. Watch-tracking enforces accountability."
          actions={
            <button className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-[12.5px] uppercase tracking-[0.08em]">
              Upload Film
            </button>
          }
        />
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] text-[11px] uppercase tracking-[0.1em] font-mono text-muted-foreground border-b border-border px-5 py-3">
            <div className="w-5"></div>
            <div>Clip · Tag</div>
            <div className="w-24">Duration</div>
            <div className="w-32">Assigned To</div>
            <div className="w-28">Due</div>
            <div className="w-32">Watch Rate</div>
          </div>
          {filmRoom.clips.map((c) => (
            <Link key={c.id} href={`/app/film/clips/${c.id}`} asChild>
              <a className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center px-5 py-3.5 border-b border-border last:border-0 hover:bg-muted/40 transition text-[13px]">
                <Film className="w-4 h-4 text-primary mr-3" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{c.title}</div>
                  <div className="text-[11px] text-muted-foreground">{c.tag}</div>
                </div>
                <div className="w-24 font-mono text-muted-foreground">{c.duration}</div>
                <div className="w-32 text-muted-foreground">
                  {c.assignedTo === "team" ? "Full Team" : "Individual"}
                </div>
                <div className="w-28 text-muted-foreground">{c.dueIn}</div>
                <div className="w-32 flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-[oklch(0.28_0.01_260)] overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${c.watchPercent}%` }} />
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {c.watchPercent}%
                  </span>
                </div>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export function FilmClipDetail() {
  const [, params] = useRoute("/app/film/clips/:id");
  const clip = filmRoom.clips.find((c) => c.id === params?.id) ?? filmRoom.clips[0];
  const [activeT, setActiveT] = useState<number | null>(null);

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1600px] mx-auto">
        <Link href="/app/film" asChild>
          <a className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
            ← Film Room
          </a>
        </Link>
        <PageHeader eyebrow={`Film Clip · ${clip.tag}`} title={clip.title} subtitle={`${clip.duration} · ${clip.dueIn}`} />

        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <div>
            <TelestrationCanvas activeTimestamp={activeT !== null ? `${Math.floor(activeT / 60)}:${(activeT % 60).toString().padStart(2, "0")}` : null} />
            <div className="mt-5 rounded-xl border border-border bg-card p-4 text-[13px] text-muted-foreground">
              <strong className="text-foreground">Watch tracking:</strong> every pause, seek, and
              completion is logged. Seeks over content do not count toward completion.
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-[13px] font-semibold">Timestamp Comments</span>
            </div>
            <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
              {clipTimestampComments.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveT(c.t)}
                  className={`w-full text-left p-4 hover:bg-muted/40 transition ${
                    activeT === c.t ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono text-[11px] text-primary shrink-0 mt-0.5">
                      {Math.floor(c.t / 60)}:{(c.t % 60).toString().padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider mb-0.5">
                        {c.author} · {c.role}
                      </div>
                      <div className="text-[13px] leading-relaxed">{c.text}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <input
                  className="flex-1 h-10 px-3 bg-transparent border border-border rounded-md text-[13px] focus:outline-none focus:border-primary"
                  placeholder="Ask a question or add note..."
                />
                <button className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-[12px] font-semibold">
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export function FilmInbox() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1000px] mx-auto">
        <PageHeader
          eyebrow="Film"
          title="Your Film Inbox"
          subtitle="Assigned clips, deadlines, watch progress. Complete by the due date."
        />
        <div className="space-y-3">
          {filmRoom.clips.map((c) => (
            <Link key={c.id} href={`/app/film/clips/${c.id}`} asChild>
              <a className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:border-primary/40 transition">
                <div className="w-32 h-20 rounded-md bg-[oklch(0.15_0.005_260)] flex items-center justify-center text-muted-foreground">
                  <Film className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11.5px] uppercase tracking-[0.1em] font-mono text-muted-foreground mb-1">
                    {c.tag}
                  </div>
                  <div className="font-medium text-[14px] mb-1">{c.title}</div>
                  <div className="text-[11.5px] text-muted-foreground flex items-center gap-2">
                    <Clock className="w-3 h-3" /> {c.duration} · {c.dueIn}
                  </div>
                </div>
                <div className="w-16 text-right">
                  <div className="display text-lg">{c.watchPercent}%</div>
                  <div className="text-[10.5px] text-muted-foreground font-mono">watched</div>
                </div>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

/* ==========================================================================
   LIVE
   ========================================================================== */

export function LiveHome() {
  const upcoming = liveEvents.filter((e) => e.startsInHours >= 0);
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Live Classes"
          title="The Global Hardwood. Live."
          subtitle="World-class coaches, world-class workouts. Broadcast from courts worldwide."
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcoming.map((e) => (
            <Link key={e.id} href={`/app/live/${e.id}`} asChild>
              <a className="rounded-xl overflow-hidden border border-border group hover:border-primary/40 transition">
                <div
                  className="aspect-[4/3] relative"
                  style={{
                    background:
                      e.posterBg === "amber"
                        ? "radial-gradient(circle at 40% 40%, oklch(0.65 0.2 50), oklch(0.12 0.01 60))"
                        : e.posterBg === "indigo"
                          ? "radial-gradient(circle at 40% 40%, oklch(0.45 0.22 290), oklch(0.12 0.01 260))"
                          : e.posterBg === "red"
                            ? "radial-gradient(circle at 40% 40%, oklch(0.55 0.22 25), oklch(0.1 0.01 20))"
                            : e.posterBg === "navy"
                              ? "radial-gradient(circle at 40% 40%, oklch(0.35 0.15 240), oklch(0.1 0.01 240))"
                              : "radial-gradient(circle at 40% 40%, oklch(0.45 0.14 180), oklch(0.1 0.01 180))",
                  }}
                >
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition" />
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-sm bg-black/70 text-white text-[10px] font-mono uppercase tracking-[0.1em]">
                    {e.intensity} · {e.category}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="text-[11px] uppercase tracking-[0.14em] font-mono opacity-80 mb-1">
                      {e.startsAt}
                    </div>
                    <div className="display text-xl leading-tight line-clamp-2">{e.title}</div>
                  </div>
                  <div className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-primary/90 backdrop-blur flex items-center justify-center">
                    <Play className="w-5 h-5 text-primary-foreground" fill="currentColor" />
                  </div>
                </div>
                <div className="p-4 bg-card flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[oklch(0.25_0.01_260)] flex items-center justify-center text-[10px] font-semibold">
                      {e.instructorInitials}
                    </div>
                    <span className="font-medium">{e.instructor}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {e.registered}/{e.capacity}
                  </span>
                </div>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export function LiveEventDetail() {
  const [, params] = useRoute("/app/live/:id");
  const event = liveEvents.find((e) => e.id === params?.id) ?? liveEvents[0];
  const { user } = useAuth();
  const hasMembership = user?.role === "ATHLETE";
  const timeLabel =
    event.startsInHours < 24
      ? `in ${event.startsInHours}h`
      : `in ${Math.floor(event.startsInHours / 24)}d`;

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1200px] mx-auto">
        <Link href="/app/live" asChild>
          <a className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
            ← Live Classes
          </a>
        </Link>

        <div
          className="relative rounded-2xl overflow-hidden mb-8 h-80 flex items-end"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, oklch(0.55 0.22 50), oklch(0.08 0.005 260))",
          }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_top,black_0%,transparent_70%)]" />
          <div className="relative p-8 w-full">
            <div className="text-[11px] uppercase tracking-[0.14em] font-mono text-primary mb-2">
              Starts {timeLabel} · {event.category} · {event.intensity}
            </div>
            <h1 className="display text-4xl lg:text-5xl leading-tight max-w-3xl">{event.title}</h1>
            <div className="mt-4 flex items-center gap-3 text-[13px] text-white/90">
              <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-[11px] font-semibold">
                {event.instructorInitials}
              </div>
              <span className="font-medium">{event.instructor}</span>
              <span className="text-white/60">· {event.durationMin} min · {event.registered.toLocaleString()} registered</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          <div>
            <h3 className="display text-xl mb-3">About this class</h3>
            <p className="text-[14px] leading-relaxed text-muted-foreground">
              Live workout broadcast straight from the court. Join with camera on, get real-time
              cues from {event.instructor.split(" ")[0]}, and stay accountable with hundreds of
              players training alongside you. Replay + resources unlocked 60 min after the session.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 h-fit sticky top-6">
            <div className="text-[11px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-3">
              Register
            </div>
            {event.memberPrice === 0 && hasMembership ? (
              <div className="display text-3xl mb-1 text-[oklch(0.75_0.18_150)]">Free</div>
            ) : (
              <div className="display text-3xl mb-1">
                ${hasMembership ? event.memberPrice : event.publicPrice}
              </div>
            )}
            <div className="text-[12px] text-muted-foreground mb-4">
              {hasMembership ? "Member price" : "Public price"}
              {hasMembership && event.publicPrice > event.memberPrice && (
                <span className="ml-2 line-through">${event.publicPrice}</span>
              )}
            </div>
            <button className="w-full h-11 rounded-md bg-primary text-primary-foreground font-semibold text-[13px] uppercase tracking-[0.08em]">
              Register Now
            </button>
            <div className="mt-4 text-[11.5px] text-muted-foreground leading-relaxed">
              Calendar invite · replay included · 60-min preview available to all members.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ==========================================================================
   LEARN / COURSES
   ========================================================================== */

export function LearnHome() {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const CATEGORY_COLORS: Record<string, string> = {
    player_development:  "oklch(0.65 0.18 250)",
    practice_design:     "oklch(0.72 0.18 290)",
    film_and_analysis:   "oklch(0.6 0.15 145)",
    defensive_systems:   "oklch(0.55 0.2 25)",
    communication:       "oklch(0.78 0.16 75)",
    program_building:    "oklch(0.6 0.2 330)",
    offensive_systems:   "oklch(0.72 0.16 200)",
  };

  const LEVEL_COLORS: Record<string, string> = {
    foundation:   "oklch(0.65 0.18 250)",
    intermediate: "oklch(0.78 0.16 75)",
    advanced:     "oklch(0.68 0.22 25)",
  };

  const filterCategories = [
    { key: "all",                label: "All" },
    { key: "player_development", label: "Player Development" },
    { key: "practice_design",    label: "Practice Design" },
    { key: "film_and_analysis",  label: "Film & Analysis" },
    { key: "defensive_systems",  label: "Defense" },
    { key: "communication",      label: "Communication" },
    { key: "program_building",   label: "Program Building" },
  ];

  const inProgressCourses = educationCourses.filter((c) => c.inProgress);

  const filteredCourses =
    activeCategory === "all"
      ? educationCourses
      : educationCourses.filter((c) => c.category === activeCategory);

  const totalLessons = educationCourses.reduce((acc, c) => acc + c.lessons.length, 0);
  const totalMin = educationCourses.reduce((acc, c) => acc + c.durationMin, 0);

  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-10 py-7 max-w-[1200px] mx-auto">
        <PageHeader
          eyebrow="Coach Education"
          title="Learn & Grow"
          subtitle="Courses built for basketball coaches who take player development seriously. Every lesson ends with something you can use tomorrow."
        />

        {/* Stats strip */}
        <div className="flex items-center gap-2 mb-8 text-[12px] text-muted-foreground font-mono">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card">
            <BookOpen className="w-3.5 h-3.5" />
            {educationCourses.length} Courses
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card">
            {totalLessons} Lessons
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card">
            ~{totalMin} min total content
          </span>
        </div>

        {/* Continue Learning */}
        {inProgressCourses.length > 0 && (
          <div className="mb-10">
            <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground/60 mb-3">
              Continue Learning
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {inProgressCourses.map((c) => {
                const catColor = CATEGORY_COLORS[c.category] ?? "oklch(0.72 0.18 290)";
                const completed = c.completedLessons ?? 0;
                const total = c.lessons.length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <Link key={c.id} href={`/app/learn/courses/${c.id}`} asChild>
                    <a className="shrink-0 w-[280px] sm:w-[320px] flex flex-col gap-3 p-4 rounded-xl border border-border bg-card hover:border-[oklch(0.72_0.18_290)/0.5] transition-all duration-150 group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span
                            className="inline-block text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded-full mb-2"
                            style={{ background: `${catColor.replace(")", " / 0.15)")}`, color: catColor }}
                          >
                            {CATEGORY_LABELS[c.category]}
                          </span>
                          <div className="font-semibold text-[13px] leading-snug line-clamp-2">{c.title}</div>
                        </div>
                        <span className="shrink-0 text-[11px] font-bold tabular-nums" style={{ color: "oklch(0.75 0.12 140)" }}>
                          {pct}%
                        </span>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
                          <span>{completed} of {total} lessons</span>
                        </div>
                        <div className="h-1 rounded-full bg-[oklch(0.22_0.005_260)] overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "oklch(0.75 0.12 140)" }} />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <span className="text-[11px] font-semibold px-3 py-1 rounded-full transition-colors"
                          style={{ background: "oklch(0.72 0.18 290 / 0.14)", color: "oklch(0.72 0.18 290)" }}>
                          Continue →
                        </span>
                      </div>
                    </a>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {filterCategories.map((cat) => {
            const active = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className="shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150 whitespace-nowrap border"
                style={active ? {
                  background: "oklch(0.72 0.18 290 / 0.14)",
                  borderColor: "oklch(0.72 0.18 290 / 0.4)",
                  color: "oklch(0.72 0.18 290)",
                  fontWeight: 600,
                } : {
                  background: "transparent",
                  borderColor: "oklch(0.28 0.005 260)",
                  color: "oklch(0.55 0.02 260)",
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Course grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((c) => {
            const catColor = CATEGORY_COLORS[c.category] ?? "oklch(0.72 0.18 290)";
            const lvlColor = LEVEL_COLORS[c.level] ?? "oklch(0.65 0.18 250)";
            const completed = c.completedLessons ?? 0;
            const total = c.lessons.length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            return (
              <div key={c.id} className="flex flex-col rounded-xl border border-border bg-card hover:border-[oklch(0.72_0.18_290)/0.4] transition-all duration-150 overflow-hidden group">
                <div className="p-5 flex-1 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded-full"
                      style={{ background: `${catColor.replace(")", " / 0.15)")}`, color: catColor }}>
                      {CATEGORY_LABELS[c.category]}
                    </span>
                    <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.06em] px-2 py-0.5 rounded-full border"
                      style={{ borderColor: `${lvlColor.replace(")", " / 0.3)")}`, color: lvlColor, background: `${lvlColor.replace(")", " / 0.08)")}` }}>
                      {LEVEL_LABELS[c.level]}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-[15px] leading-snug mb-1">{c.title}</div>
                    <div className="text-[12.5px] text-muted-foreground leading-snug line-clamp-2">{c.subtitle}</div>
                  </div>
                  <div className="text-[11.5px] text-muted-foreground font-mono mt-auto">
                    ~{c.durationMin} min · {total} lessons
                  </div>
                </div>
                <div className="border-t border-border px-5 py-3.5 flex items-center justify-between gap-3">
                  {c.inProgress && (
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded-full"
                      style={{ background: "oklch(0.75 0.12 140 / 0.15)", color: "oklch(0.75 0.12 140)" }}>
                      In Progress
                    </span>
                  )}
                  {completed > 0 ? (
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
                        <span>{completed} of {total} complete</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-[oklch(0.22_0.005_260)] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "oklch(0.75 0.12 140)" }} />
                      </div>
                    </div>
                  ) : (
                    <Link href={`/app/learn/courses/${c.id}`} asChild>
                      <a className="ml-auto text-[12px] font-semibold px-3.5 py-1.5 rounded-full transition-colors"
                        style={{ background: "oklch(0.72 0.18 290 / 0.12)", color: "oklch(0.72 0.18 290)" }}>
                        Start course →
                      </a>
                    </Link>
                  )}
                  {completed > 0 && (
                    <Link href={`/app/learn/courses/${c.id}`} asChild>
                      <a className="shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors"
                        style={{ background: "oklch(0.72 0.18 290 / 0.12)", color: "oklch(0.72 0.18 290)" }}>
                        Continue
                      </a>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

export function LearnCourseDetail() {
  const [, params] = useRoute("/app/learn/courses/:id");
  const course = getCourse(params?.id ?? "") ?? educationCourses[0];

  const [activeLessonId, setActiveLessonId] = useState<string>(course.lessons[0]?.id ?? "");
  const [completedCount, setCompletedCount] = useState<number>(course.completedLessons ?? 0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeLesson = course.lessons.find((l) => l.id === activeLessonId) ?? course.lessons[0];
  const activeLessonIdx = course.lessons.findIndex((l) => l.id === activeLessonId);
  const totalLessons = course.lessons.length;
  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const allDone = completedCount >= totalLessons;

  const CATEGORY_COLORS: Record<string, string> = {
    player_development:  "oklch(0.65 0.18 250)",
    practice_design:     "oklch(0.72 0.18 290)",
    film_and_analysis:   "oklch(0.6 0.15 145)",
    defensive_systems:   "oklch(0.55 0.2 25)",
    communication:       "oklch(0.78 0.16 75)",
    program_building:    "oklch(0.6 0.2 330)",
    offensive_systems:   "oklch(0.72 0.16 200)",
  };
  const LEVEL_COLORS: Record<string, string> = {
    foundation:   "oklch(0.65 0.18 250)",
    intermediate: "oklch(0.78 0.16 75)",
    advanced:     "oklch(0.68 0.22 25)",
  };

  const catColor = CATEGORY_COLORS[course.category] ?? "oklch(0.72 0.18 290)";
  const lvlColor = LEVEL_COLORS[course.level] ?? "oklch(0.65 0.18 250)";

  function handleMarkComplete() {
    if (completedCount < totalLessons) {
      const newCount = Math.max(completedCount, activeLessonIdx + 1);
      setCompletedCount(newCount);
      if (activeLessonIdx < totalLessons - 1) {
        setActiveLessonId(course.lessons[activeLessonIdx + 1].id);
      }
    }
  }

  function renderBlock(block: LessonBlock, idx: number) {
    if (block.type === "p") {
      return <p key={idx} className="text-[14px] leading-relaxed text-foreground/90 mb-4">{block.content}</p>;
    }
    if (block.type === "h2") {
      return <h2 key={idx} className="text-[17px] font-bold mt-6 mb-3">{block.content}</h2>;
    }
    if (block.type === "h3") {
      return <h3 key={idx} className="text-[15px] font-semibold mt-4 mb-2">{block.content}</h3>;
    }
    if (block.type === "quote") {
      return (
        <blockquote key={idx} className="my-5 pl-4 border-l-[3px] italic" style={{ borderColor: "oklch(0.72 0.18 290)" }}>
          <p className="text-[14px] leading-relaxed text-foreground/80 mb-1">"{block.content}"</p>
          {block.attribution && (
            <footer className="text-[11.5px] text-muted-foreground not-italic font-medium">— {block.attribution}</footer>
          )}
        </blockquote>
      );
    }
    if (block.type === "bullets") {
      return (
        <ul key={idx} className="mb-4 space-y-2">
          {block.content.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-[14px] leading-relaxed text-foreground/90">
              <ChevronRight className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "oklch(0.72 0.18 290)" }} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    }
    if (block.type === "callout") {
      const variant = block.variant ?? "info";
      const variantStyles = {
        info:    { bg: "oklch(0.65 0.18 250 / 0.10)", border: "oklch(0.65 0.18 250 / 0.35)", color: "oklch(0.65 0.18 250)", icon: "ℹ" },
        warning: { bg: "oklch(0.78 0.16 75 / 0.10)",  border: "oklch(0.78 0.16 75 / 0.35)",  color: "oklch(0.78 0.16 75)",  icon: "⚠" },
        tip:     { bg: "oklch(0.75 0.12 140 / 0.10)", border: "oklch(0.75 0.12 140 / 0.35)", color: "oklch(0.75 0.12 140)", icon: "✦" },
      }[variant];
      return (
        <div key={idx} className="my-5 flex items-start gap-3 p-4 rounded-xl border text-[13.5px] leading-relaxed"
          style={{ background: variantStyles.bg, borderColor: variantStyles.border }}>
          <span className="shrink-0 font-bold text-[15px]" style={{ color: variantStyles.color }}>{variantStyles.icon}</span>
          <span className="text-foreground/85">{block.content}</span>
        </div>
      );
    }
    return null;
  }

  const LessonList = (
    <div className="flex flex-col divide-y divide-border">
      {course.lessons.map((lesson, idx) => {
        const isActive = lesson.id === activeLessonId;
        const isDone = idx < completedCount;
        return (
          <button key={lesson.id} onClick={() => { setActiveLessonId(lesson.id); setSidebarOpen(false); }}
            className="flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30 group"
            style={isActive ? { background: "oklch(0.72 0.18 290 / 0.10)" } : undefined}>
            <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all"
              style={isDone
                ? { background: "oklch(0.75 0.12 140)", borderColor: "oklch(0.75 0.12 140)", color: "#fff" }
                : isActive
                ? { background: "oklch(0.72 0.18 290 / 0.20)", borderColor: "oklch(0.72 0.18 290)", color: "oklch(0.72 0.18 290)" }
                : { background: "transparent", borderColor: "oklch(0.32 0.005 260)", color: "oklch(0.55 0.02 260)" }}>
              {isDone ? "✓" : idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-medium leading-snug line-clamp-2 transition-colors"
                style={{ color: isActive ? "oklch(0.72 0.18 290)" : undefined }}>
                {lesson.title}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">{lesson.durationMin} min</div>
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <AppShell>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-7">
        <Link href="/app/learn" asChild>
          <a className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground mb-6 transition-colors">
            ← Back to Learn
          </a>
        </Link>

        {/* Course header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full"
              style={{ background: `${catColor.replace(")", " / 0.15)")}`, color: catColor }}>
              {CATEGORY_LABELS[course.category]}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] px-2.5 py-1 rounded-full border"
              style={{ borderColor: `${lvlColor.replace(")", " / 0.3)")}`, color: lvlColor, background: `${lvlColor.replace(")", " / 0.08)")}` }}>
              {LEVEL_LABELS[course.level]}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-2">{course.title}</h1>
          <p className="text-[13.5px] text-muted-foreground leading-relaxed max-w-2xl mb-4">{course.description}</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12.5px] text-muted-foreground font-mono mb-5">
            <span>{totalLessons} lessons</span>
            <span>·</span>
            <span>~{course.durationMin} min</span>
            <span>·</span>
            <span>{LEVEL_LABELS[course.level]}</span>
          </div>
          {completedCount > 0 && (
            <div className="max-w-lg">
              <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
                <span>{completedCount} of {totalLessons} lessons complete</span>
                <span style={{ color: "oklch(0.75 0.12 140)" }}>{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[oklch(0.22_0.005_260)] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "oklch(0.75 0.12 140)" }} />
              </div>
            </div>
          )}
        </div>

        {/* Mobile: lesson toggle */}
        <div className="lg:hidden mb-4">
          <button onClick={() => setSidebarOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card text-[13px] font-medium">
            <span>Lesson {activeLessonIdx + 1}: {activeLesson?.title}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform"
              style={{ transform: sidebarOpen ? "rotate(90deg)" : undefined }} />
          </button>
          {sidebarOpen && (
            <div className="mt-2 rounded-xl border border-border bg-card overflow-hidden">{LessonList}</div>
          )}
        </div>

        {/* Main layout */}
        <div className="flex gap-8 items-start">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-[280px] shrink-0 rounded-xl border border-border bg-card overflow-hidden sticky top-6">
            <div className="px-4 py-3 border-b border-border">
              <div className="text-[10.5px] uppercase tracking-[0.12em] font-semibold text-muted-foreground/60">
                {totalLessons} Lessons
              </div>
            </div>
            {LessonList}
          </aside>

          {/* Lesson content */}
          <div className="flex-1 min-w-0">
            {allDone ? (
              <div className="rounded-2xl border border-[oklch(0.75_0.12_140)/0.4] bg-[oklch(0.75_0.12_140)/0.07] p-8 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-[22px] font-bold mb-2">Course Complete</h2>
                <p className="text-[14px] text-muted-foreground leading-relaxed max-w-md mx-auto">
                  You've completed <strong>{course.title}</strong>. Apply what you've learned in your next session.
                </p>
                <Link href="/app/learn" asChild>
                  <a className="inline-block mt-6 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-colors"
                    style={{ background: "oklch(0.72 0.18 290)", color: "#fff" }}>
                    Browse More Courses
                  </a>
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-6 py-5 border-b border-border flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-mono text-muted-foreground mb-1 uppercase tracking-[0.1em]">
                      Lesson {activeLessonIdx + 1} of {totalLessons}
                    </div>
                    <h2 className="text-[17px] font-bold leading-snug">{activeLesson?.title}</h2>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full font-mono"
                    style={{ background: "oklch(0.22 0.005 260)", color: "oklch(0.6 0.02 260)" }}>
                    {activeLesson?.durationMin} min
                  </span>
                </div>

                <div className="px-6 py-6">
                  {activeLesson?.body.map((block, idx) => renderBlock(block, idx))}
                </div>

                {activeLesson?.actionType !== "none" && activeLesson?.actionHref && (
                  <div className="mx-6 mb-6 p-5 rounded-xl border"
                    style={{ background: "oklch(0.72 0.18 290 / 0.07)", borderColor: "oklch(0.72 0.18 290 / 0.3)" }}>
                    <div className="text-[11px] uppercase tracking-[0.1em] font-semibold mb-1" style={{ color: "oklch(0.72 0.18 290)" }}>
                      Try it in HoopsIQ
                    </div>
                    <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
                      This lesson ends with an action — apply what you just learned directly in your account.
                    </p>
                    <Link href={activeLesson.actionHref} asChild>
                      <a className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors"
                        style={{ background: "oklch(0.72 0.18 290)", color: "#fff" }}>
                        {activeLesson.actionLabel ?? "Open in HoopsIQ"}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </Link>
                  </div>
                )}

                <div className="px-6 pb-6 flex items-center justify-between gap-3 flex-wrap border-t border-border pt-5">
                  <div className="flex items-center gap-2">
                    <button disabled={activeLessonIdx === 0}
                      onClick={() => setActiveLessonId(course.lessons[activeLessonIdx - 1].id)}
                      className="px-3.5 py-2 rounded-lg text-[12.5px] font-medium border border-border bg-card hover:bg-muted/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      ← Previous
                    </button>
                    <button disabled={activeLessonIdx === totalLessons - 1}
                      onClick={() => setActiveLessonId(course.lessons[activeLessonIdx + 1].id)}
                      className="px-3.5 py-2 rounded-lg text-[12.5px] font-medium border border-border bg-card hover:bg-muted/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      Next →
                    </button>
                  </div>
                  <button onClick={handleMarkComplete} disabled={activeLessonIdx < completedCount}
                    className="px-4 py-2 rounded-lg text-[12.5px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-default"
                    style={activeLessonIdx < completedCount
                      ? { background: "oklch(0.75 0.12 140 / 0.15)", color: "oklch(0.75 0.12 140)" }
                      : { background: "oklch(0.72 0.18 290)", color: "#fff" }}>
                    {activeLessonIdx < completedCount ? "✓ Complete" : "Mark Complete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ==========================================================================
   BILLING — for all roles
   ========================================================================== */

export function SettingsBilling() {
  const { user } = useAuth();
  const isAthlete = user?.role === "ATHLETE";
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1000px] mx-auto">
        <PageHeader eyebrow="Settings" title="Billing" subtitle="Manage subscription, entitlements, and invoices." />
        {isAthlete && user?.hasTeamDiscount && (
          <div className="rounded-xl border border-[oklch(0.55_0.18_150)]/40 bg-[oklch(0.18_0.05_150)]/30 p-5 mb-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[oklch(0.75_0.18_150)] mt-0.5" />
              <div>
                <div className="font-semibold text-[oklch(0.85_0.18_150)] mb-1">
                  Team Discount Active · 50% OFF
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Because you're on the active roster of <strong>Texas Elite Varsity</strong>, your
                  Player Core subscription is automatically 50% off. Valid until you leave the
                  roster or the team plan cancels.
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-1">
                Current Plan
              </div>
              <h3 className="display text-2xl">
                {isAthlete ? "Player Core · Monthly" : user?.role === "COACH" ? "Coach Core · Monthly" : "Active Plan"}
              </h3>
            </div>
            <div className="text-right">
              <div className="display text-3xl">
                {isAthlete && user?.hasTeamDiscount ? "$9.99" : isAthlete ? "$19.99" : "$49.99"}
              </div>
              <div className="text-[11.5px] text-muted-foreground">/ month</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-9 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-[12.5px] uppercase tracking-[0.08em]">
              Manage Plan
            </button>
            <button className="h-9 px-4 rounded-md border border-border text-[12.5px]">
              Payment Method
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ==========================================================================
   ADMIN
   ========================================================================== */

export function AdminOverview() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader eyebrow="Trust & Safety · SUPER_ADMIN" title="Platform Overview" subtitle="The command deck. Every action is audited." />
        <div className="grid md:grid-cols-4 gap-3 mb-10">
          <StatCard label="Total Users" value="18,432" trend="+312 this week" accent="primary" icon={<Users className="w-4 h-4" />} />
          <StatCard label="Active Subs" value="4,180" trend="MRR $112k" accent="success" icon={<CreditCard className="w-4 h-4" />} />
          <StatCard label="Open Moderation" value={moderationQueue.length} trend="1 child-safety priority" accent="danger" icon={<Flag className="w-4 h-4" />} />
          <StatCard label="AI Jobs (24h)" value="2,847" trend="99.2% success rate" accent="indigo" icon={<Activity className="w-4 h-4" />} />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <AdminRecent />
          <div className="rounded-xl border border-border bg-card">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="display text-[17px]">Moderation Queue</h3>
            </div>
            <div className="divide-y divide-border">
              {moderationQueue.map((m) => (
                <div key={m.id} className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <PriorityChip p={m.priority} />
                    <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider">
                      {m.type}
                    </span>
                  </div>
                  <div className="text-[13px]">{m.content}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Reporter: {m.reporter} · {m.age}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function PriorityChip({ p }: { p: string }) {
  const cls =
    p === "CHILD_SAFETY"
      ? "bg-[oklch(0.55_0.2_25)]/20 text-[oklch(0.85_0.2_25)]"
      : p === "HIGH"
        ? "bg-[oklch(0.7_0.2_30)]/15 text-[oklch(0.85_0.2_30)]"
        : p === "MEDIUM"
          ? "bg-[oklch(0.72_0.17_75)]/15 text-[oklch(0.85_0.17_75)]"
          : "bg-muted text-muted-foreground";
  return (
    <span className={`px-1.5 py-0.5 rounded-sm text-[10.5px] font-mono uppercase tracking-wider font-bold ${cls}`}>
      {p.replace("_", " ")}
    </span>
  );
}

function AdminRecent() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="display text-[17px]">Recent Audit Activity</h3>
      </div>
      <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
        {auditLog.slice(0, 6).map((a) => (
          <div key={a.id} className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground">
                {a.action}
              </span>
              <span className="text-[11px] text-muted-foreground">{a.ts}</span>
            </div>
            <div className="text-[13px]">
              <span className="font-semibold">{a.actor}</span>{" "}
              <span className="text-muted-foreground">→</span>{" "}
              <span>{a.target}</span>
            </div>
            <div className="text-[11.5px] text-muted-foreground mt-1">{a.reason}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminUsers() {
  const [query, setQuery] = useState("");
  const results = useMemo(
    () =>
      demoUsers.filter(
        (u) =>
          !query ||
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.handle.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader eyebrow="Admin" title="User Lookup" subtitle="Search, inspect, or impersonate any account. Every action audited." />
        <div className="flex items-center gap-2 mb-5">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or handle..."
              className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-amber-400/60"
            />
          </div>
          <Button variant="outline">Export CSV</Button>
        </div>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_auto] text-[11px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted/40 border-b border-border px-4 py-2.5">
            <div>User</div>
            <div>Role</div>
            <div>Status</div>
            <div>Plan</div>
            <div className="text-right">Actions</div>
          </div>
          {results.map((u) => (
            <div key={u.id} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_auto] items-center px-4 py-3 text-sm border-b border-border last:border-b-0 hover:bg-muted/30">
              <div>
                <p className="font-semibold">{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.handle}</p>
              </div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{u.role}</div>
              <div><Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">ACTIVE</Badge></div>
              <div className="text-xs text-muted-foreground">{u.role === "ATHLETE" ? "Player Core" : u.role === "COACH" ? "Coach Core" : "—"}</div>
              <div className="flex items-center gap-2 justify-end">
                <Button variant="outline" size="sm">Inspect</Button>
                <Button variant="outline" size="sm" className="border-destructive/40 text-destructive hover:bg-destructive/10">Impersonate</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

/* ===========================================================================
 * PLAYBOOK STUDIO — interactive react-konva court canvas
 * ========================================================================= */

type TokenT = { id: string; kind: "O" | "D" | "B"; label: string; x: number; y: number };
type PathT = { id: string; kind: "PASS" | "CUT" | "DRIBBLE" | "SCREEN"; points: number[] };

const INITIAL_TOKENS: TokenT[] = [
  { id: "o1", kind: "O", label: "1", x: 140, y: 320 },
  { id: "o2", kind: "O", label: "2", x: 60, y: 200 },
  { id: "o3", kind: "O", label: "3", x: 500, y: 200 },
  { id: "o4", kind: "O", label: "4", x: 200, y: 120 },
  { id: "o5", kind: "O", label: "5", x: 360, y: 120 },
  { id: "b", kind: "B", label: "BALL", x: 140, y: 320 },
  { id: "d1", kind: "D", label: "X1", x: 180, y: 300 },
  { id: "d2", kind: "D", label: "X2", x: 100, y: 200 },
  { id: "d3", kind: "D", label: "X3", x: 470, y: 200 },
  { id: "d4", kind: "D", label: "X4", x: 240, y: 140 },
  { id: "d5", kind: "D", label: "X5", x: 330, y: 140 },
];

const INITIAL_PATHS: PathT[] = [
  { id: "p1", kind: "PASS", points: [140, 320, 60, 200] },
  { id: "p2", kind: "CUT", points: [60, 200, 200, 120] },
  { id: "p3", kind: "SCREEN", points: [360, 120, 500, 200] },
];

function Court() {
  // half-court markings
  return (
    <>
      <Rect x={0} y={0} width={560} height={400} fill="#1B2A1F" />
      <Rect x={0} y={0} width={560} height={400} stroke="#F59E0B" strokeWidth={2} />
      {/* baseline */}
      <Line points={[0, 0, 560, 0]} stroke="#F59E0B" strokeWidth={3} />
      {/* key */}
      <Rect x={220} y={0} width={120} height={160} stroke="#F59E0B" strokeWidth={2} />
      {/* free throw circle */}
      <Circle x={280} y={160} radius={60} stroke="#F59E0B" strokeWidth={2} />
      {/* restricted arc */}
      <Circle x={280} y={40} radius={40} stroke="#F59E0B" strokeWidth={1.5} />
      {/* three point arc (approximation) */}
      <Line
        points={[40, 0, 40, 140]}
        stroke="#F59E0B"
        strokeWidth={2}
      />
      <Line points={[520, 0, 520, 140]} stroke="#F59E0B" strokeWidth={2} />
      <Circle x={280} y={40} radius={237} stroke="#F59E0B" strokeWidth={2} />
      {/* rim */}
      <Circle x={280} y={40} radius={10} stroke="#F59E0B" strokeWidth={2} />
    </>
  );
}

export function PlaybookStudio() {
  const [tokens, setTokens] = useState<TokenT[]>(INITIAL_TOKENS);
  const [paths] = useState<PathT[]>(INITIAL_PATHS);
  const [selected, setSelected] = useState<string | null>(null);
  const stageRef = useRef<any>(null);
  const updateTokenPos = (id: string, x: number, y: number) => {
    setTokens((prev: TokenT[]) => prev.map((t: TokenT) => (t.id === id ? { ...t, x, y } : t)));
  };;

  const pathColor = (kind: PathT["kind"]) =>
    kind === "PASS" ? "#F59E0B" : kind === "CUT" ? "#A3A3A3" : kind === "SCREEN" ? "#EF4444" : "#6D28D9";
  const pathDash = (kind: PathT["kind"]) => (kind === "CUT" ? [8, 6] : kind === "DRIBBLE" ? [2, 4] : []);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Playbook Studio</p>
        <h1 className="font-display text-3xl uppercase tracking-tight">Horns 45 — Flare Screen</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Frame 1 of 4 · Click a token to select, drag to reposition. Paths are static in this demo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
        {/* canvas */}
        <div className="rounded-xl border border-border bg-zinc-950 p-4 flex items-center justify-center">
          <Stage
            ref={stageRef}
            width={560}
            height={400}
            onMouseDown={(e) => {
              if (e.target === e.target.getStage()) setSelected(null);
            }}
          >
            <Layer>
              <Court />
              {/* paths */}
              {paths.map((p: PathT) => (
                <Line
                  key={p.id}
                  points={p.points}
                  stroke={pathColor(p.kind)}
                  strokeWidth={2.5}
                  dash={pathDash(p.kind)}
                  lineCap="round"
                  lineJoin="round"
                />
              ))}
              {/* tokens */}
              {tokens.map((t: TokenT) => {
                const isSelected = selected === t.id;
                const fill = t.kind === "O" ? "#F59E0B" : t.kind === "D" ? "#0A0A0A" : "#F5F5F5";
                const stroke = t.kind === "D" ? "#EF4444" : "#0A0A0A";
                const textColor = t.kind === "B" ? "#0A0A0A" : t.kind === "D" ? "#EF4444" : "#0A0A0A";
                return (
                  <Circle
                    key={t.id}
                    x={t.x}
                    y={t.y}
                    radius={t.kind === "B" ? 10 : 18}
                    fill={fill}
                    stroke={isSelected ? "#6D28D9" : stroke}
                    strokeWidth={isSelected ? 3 : 2}
                    draggable
                    onClick={() => setSelected(t.id)}
                    onTap={() => setSelected(t.id)}
                    onDragMove={(e) => updateTokenPos(t.id, e.target.x(), e.target.y())}
                  />
                );
              })}
              {/* token labels */}
              {tokens.map((t: TokenT) =>
                t.kind === "B" ? null : (
                  <KonvaText
                    key={`${t.id}-label`}
                    x={t.x - 8}
                    y={t.y - 7}
                    text={t.label}
                    fontSize={14}
                    fontStyle="bold"
                    fill={t.kind === "D" ? "#EF4444" : "#0A0A0A"}
                    listening={false}
                  />
                )
              )}
            </Layer>
          </Stage>
        </div>

        {/* right panel */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2">Phase</p>
            <div className="inline-flex items-center rounded-md border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-400 uppercase">
              Entry
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2">Tools</p>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {["Select (V)", "Token (T)", "Pass (P)", "Cut (C)", "Dribble (D)", "Screen (S)"].map((x) => (
                <div key={x} className="rounded-md border border-border bg-background px-2 py-1.5 font-mono">
                  {x}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2">Selected</p>
            <p className="text-sm font-semibold">
              {selected ? tokens.find((t) => t.id === selected)?.label || selected : "— nothing —"}
            </p>
          </div>
          <div className="pt-3 border-t border-border">
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2">Frames</p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className={`h-8 flex-1 rounded-md border text-xs flex items-center justify-center font-semibold ${
                    n === 1 ? "border-amber-400/60 bg-amber-400/10 text-amber-400" : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {n}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================================
 * ADMIN — Moderation & Audit
 * ========================================================================= */
export function AdminModeration() {
  const queue = moderationQueue;
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Moderation</p>
        <h1 className="font-display text-3xl uppercase tracking-tight">Moderation Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {queue.length} items pending. <span className="text-destructive font-semibold">Child safety flags pinned first.</span>
        </p>
      </div>
      <div className="space-y-3">
        {queue.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl border p-4 bg-card ${
              item.priority === "CHILD_SAFETY" ? "border-destructive/50" : "border-border"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {item.priority === "CHILD_SAFETY" && (
                    <span className="inline-flex items-center rounded-md bg-destructive/15 text-destructive border border-destructive/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                      Child Safety
                    </span>
                  )}
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">{item.type}</span>
                  <span className="text-xs text-muted-foreground">· reported by {item.reporter}</span>
                </div>
                <p className="font-semibold">{item.content}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.age}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm">
                  Dismiss
                </Button>
                <Button variant="outline" size="sm">
                  Warn
                </Button>
                <Button variant="outline" size="sm">
                  Suspend
                </Button>
                <Button size="sm" className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Ban
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminAudit() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Audit Log</p>
        <h1 className="font-display text-3xl uppercase tracking-tight">Immutable Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">Every mutating action. Searchable. Exportable.</p>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_1.5fr_1fr_1fr_0.8fr] text-[11px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted/40 border-b border-border px-4 py-2.5">
          <div>Actor</div>
          <div>Action</div>
          <div>Target</div>
          <div>Reason</div>
          <div className="text-right">When</div>
        </div>
        {auditLog.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-[1fr_1.5fr_1fr_1fr_0.8fr] px-4 py-3 text-sm border-b border-border last:border-b-0 hover:bg-muted/30"
          >
            <div className="font-semibold">{row.actor}</div>
            <div className="font-mono text-xs text-amber-400">{row.action}</div>
            <div className="text-muted-foreground">{row.target}</div>
            <div className="text-muted-foreground truncate">{row.reason}</div>
            <div className="text-right text-muted-foreground font-mono text-xs">{row.ts}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===========================================================================
 * PARENT — billing/entitlement observer view
 * ========================================================================= */
export function ParentDashboard() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Parent Portal</p>
        <h1 className="font-display text-3xl uppercase tracking-tight">Family Overview</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2">Linked Athlete</p>
          <p className="font-display text-2xl uppercase">Jaylen B.</p>
          <p className="text-sm text-muted-foreground mt-1">Texas Elite · 17U · PG · Age 16</p>
          <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subscription</span>
              <span className="font-semibold">Player Core</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly price</span>
              <span className="font-semibold tabular-nums">$9.99 <span className="text-xs text-muted-foreground line-through ml-1">$19.99</span></span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next renewal</span>
              <span className="font-semibold tabular-nums">May 15, 2026</span>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-5">
          <div className="inline-flex items-center rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider mb-2">
            50% Discount Active
          </div>
          <p className="font-semibold">Because Jaylen plays for Texas Elite</p>
          <p className="text-sm text-muted-foreground mt-1">
            The coach's Team Pro plan unlocks a 50% lifetime discount on Player Core while Jaylen is on an active roster. Discount is re-validated each renewal.
          </p>
          <div className="mt-4 pt-4 border-t border-emerald-400/20 text-xs text-muted-foreground">
            <span className="font-mono">GRANTED 2025-08-22</span> · by Coach Thompson
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================================
 * EXPERT — dashboard with payouts preview
 * ========================================================================= */
export function ExpertDashboard() {
  const offers = expertOffers.slice(0, 3);
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Expert Dashboard</p>
          <h1 className="font-display text-3xl uppercase tracking-tight">Your Marketplace</h1>
        </div>
        <Button>New Offer</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "GMV (30d)", value: "$4,820" },
          { label: "Bookings (30d)", value: "32" },
          { label: "Avg. rating", value: "4.9" },
          { label: "Payout pending", value: "$3,856" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="font-display text-2xl mt-1 tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="font-semibold mb-3">Active offers</p>
        <div className="space-y-2">
          {offers.map((o: any) => (
            <div key={o.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 rounded-md border border-border bg-background px-3 py-2.5 text-sm">
              <div>
                <p className="font-semibold">{o.title}</p>
                <p className="text-xs text-muted-foreground">{o.kind}</p>
              </div>
              <div className="text-xs text-muted-foreground">{o.bookings30d} bookings / 30d</div>
              <div className="tabular-nums font-semibold">${o.publicPrice}</div>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <AppShell>
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-4xl mb-4">🏗️</div>
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground">This section is coming soon.</p>
      </div>
    </AppShell>
  );
}

export function AdminExperts() { return <ComingSoon title="Expert Verification" />; }
export function AdminJobs() { return <ComingSoon title="AI Jobs" />; }
export function ExpertOffers() { return <ComingSoon title="Offers" />; }
export function ExpertBookings() { return <ComingSoon title="Bookings" />; }
export function ParentChild() { return <ComingSoon title="My Child" />; }
export function ParentBilling() { return <ComingSoon title="Billing" />; }
export function TeamRoster() { return <ComingSoon title="All Athletes" />; }
export function TeamTeams() { return <ComingSoon title="Teams" />; }
export function TeamSettings() { return <ComingSoon title="Settings" />; }
