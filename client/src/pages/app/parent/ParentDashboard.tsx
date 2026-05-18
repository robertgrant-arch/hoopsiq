import { Link } from "wouter";
import {
  Calendar, CreditCard, FileText, MessageSquare,
  Bell, ChevronRight, CheckCircle2, AlertCircle,
  Clock, Trophy, TrendingUp, Users, BarChart3,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import {
  mockScheduleEvents, mockBillingItems,
  mockForms, mockDevelopmentSummary, mockAnnouncements,
} from "@/lib/mock/parent";
import { useAnnouncements } from "@/lib/api/hooks/useAnnouncements";
import { useGuardianChildren } from "@/lib/api/hooks/useParent";
import {
  ACTIVE_GUARDIAN,
  GUARDIAN_PLAYER_PROFILES,
  getThreadsForGuardian,
  isAnnouncementRead,
} from "@/lib/mock/guardian";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatPostedAt(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

/* -------------------------------------------------------------------------- */
/* Child hero card                                                              */
/* -------------------------------------------------------------------------- */

function ChildHero() {
  const { data: children = [], isLoading } = useGuardianChildren();
  const child = children[0] ?? null;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 h-[120px] flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-muted border-t-foreground animate-spin" />
      </div>
    );
  }

  if (!child) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-center text-[13px] text-muted-foreground">
        No linked athlete found. Contact your program admin.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex items-start gap-4">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-[15px] font-bold shrink-0 text-white"
        style={{ background: "oklch(0.72 0.18 290)" }}
      >
        {child.avatarInitials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-[18px] font-bold leading-tight">{child.name}</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              #{child.jerseyNumber} · {child.position} · {child.team} · Class of {child.gradYear}
            </p>
          </div>
          <Link href="/app/parent/child">
            <a>
              <Button variant="outline" size="sm" className="gap-1">
                Full profile <ChevronRight className="w-3 h-3" />
              </Button>
            </a>
          </Link>
        </div>
        <div className="flex gap-4 mt-3 flex-wrap">
          <div className="text-center">
            <div className="font-mono font-bold text-[18px]" style={{ color: "oklch(0.78 0.17 75)" }}>
              {child.level}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Level</div>
          </div>
          <div className="text-center">
            <div className="font-mono font-bold text-[18px]">{child.xp.toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">XP</div>
          </div>
          <div className="text-center">
            <div className="font-mono font-bold text-[18px]" style={{ color: "oklch(0.72 0.17 75)" }}>
              {child.streak}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Day streak</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Action-needed strip                                                          */
/* -------------------------------------------------------------------------- */

function ActionNeeded() {
  const pendingForms = mockForms.filter((f) => f.status === "pending");
  const pendingBilling = mockBillingItems.filter((b) => b.status === "pending" || b.status === "overdue");

  if (pendingForms.length === 0 && pendingBilling.length === 0) return null;

  const items = [
    ...pendingForms.map((f) => ({
      id: f.id,
      label: f.title,
      sub: f.dueDate ? `Due ${formatDate(f.dueDate)}` : "Action required",
      href: "/app/parent/forms",
      urgent: f.status === "pending" && f.required,
    })),
    ...pendingBilling.map((b) => ({
      id: b.id,
      label: b.description,
      sub: `$${(b.amount / 100).toFixed(2)} due ${formatDate(b.dueDate)}`,
      href: "/app/parent/billing",
      urgent: b.status === "overdue",
    })),
  ];

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-4 h-4" style={{ color: "oklch(0.72 0.17 75)" }} />
        <span className="font-semibold text-[13px]">Action needed</span>
        <Badge variant="secondary" className="ml-auto">{items.length}</Badge>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <Link key={item.id} href={item.href} asChild>
            <a className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 hover:bg-muted/30 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium truncate">{item.label}</div>
                <div className="text-[11px] text-muted-foreground">{item.sub}</div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Quick links                                                                  */
/* -------------------------------------------------------------------------- */

function QuickLinks() {
  const guardian = ACTIVE_GUARDIAN;
  const unreadMessages = getThreadsForGuardian(guardian.id).filter((t) => !t.isRead).length;
  const unreadAnnouncements = mockAnnouncements.filter(
    (a) => !isAnnouncementRead(a.id, guardian.id)
  ).length;
  const totalUnread = unreadMessages + unreadAnnouncements;

  const links = [
    { href: "/app/parent/schedule", label: "Schedule", Icon: Calendar, color: "oklch(0.72 0.18 290)", badge: 0 },
    { href: "/app/parent/billing", label: "Billing", Icon: CreditCard, color: "oklch(0.78 0.17 75)", badge: 0 },
    { href: "/app/parent/forms", label: "Forms", Icon: FileText, color: "oklch(0.75 0.12 140)", badge: mockForms.filter((f) => f.status === "pending").length },
    { href: "/app/parent/messages", label: "Messages", Icon: MessageSquare, color: "oklch(0.68 0.22 25)", badge: totalUnread },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {links.map((l) => (
        <Link key={l.href} href={l.href} asChild>
          <a className="relative rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-2 hover:shadow-sm hover:-translate-y-0.5 transition-all">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${l.color}20`, color: l.color }}
            >
              <l.Icon className="w-5 h-5" />
            </div>
            <span className="text-[12px] font-medium">{l.label}</span>
            {l.badge > 0 && (
              <span
                className="absolute top-2 right-2 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center text-white"
                style={{ background: "oklch(0.68 0.22 25)" }}
              >
                {l.badge}
              </span>
            )}
          </a>
        </Link>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Athletes section (multi-child support)                                       */
/* -------------------------------------------------------------------------- */

function AthletesSection() {
  const guardian = ACTIVE_GUARDIAN;
  if (guardian.linkedPlayerIds.length <= 1) return null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-1.5 font-semibold text-[13px]">
          <Users className="w-4 h-4" /> Your Athletes
        </div>
        <span className="text-[11px] text-muted-foreground">
          {guardian.linkedPlayerIds.length} linked
        </span>
      </div>
      <div className="divide-y divide-border/50">
        {guardian.linkedPlayerIds.map((pid) => {
          const profile = GUARDIAN_PLAYER_PROFILES[pid];
          if (!profile) return null;
          return (
            <Link key={pid} href={`/app/parent/player/${pid}/summary`} asChild>
              <a className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                  style={{ background: "oklch(0.72 0.18 290)" }}
                >
                  {profile.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold">{profile.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    #{profile.jerseyNumber} · {profile.position} · {profile.team}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                </div>
              </a>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Next event                                                                   */
/* -------------------------------------------------------------------------- */

function NextEvent() {
  const upcoming = mockScheduleEvents
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  if (!upcoming) return null;

  const typeColor: Record<string, string> = {
    game: "oklch(0.68 0.22 25)",
    tournament: "oklch(0.72 0.18 290)",
    practice: "oklch(0.75 0.12 140)",
    conditioning: "oklch(0.78 0.17 75)",
    film: "oklch(0.7 0.18 310)",
  };
  const color = typeColor[upcoming.type] ?? "oklch(0.72 0.18 290)";

  return (
    <Link href="/app/parent/schedule" asChild>
      <a className="block rounded-xl border bg-card p-4 hover:shadow-sm transition-all"
        style={{ borderColor: `${color}40` }}>
        <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
          <Clock className="w-3 h-3" /> Next event
        </div>
        <div className="font-bold text-[15px]">{upcoming.title}</div>
        <div className="text-[12px] text-muted-foreground mt-1">
          {formatDate(upcoming.date)} · {upcoming.startTime} · {upcoming.location}
        </div>
        {upcoming.rsvpStatus === null && upcoming.required && (
          <div className="mt-2 text-[11px] font-semibold" style={{ color: "oklch(0.72 0.17 75)" }}>
            RSVP needed
          </div>
        )}
      </a>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Dev summary strip                                                            */
/* -------------------------------------------------------------------------- */

function DevSummary() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 font-semibold text-[13px]">
          <TrendingUp className="w-4 h-4" /> Development
        </div>
        <Link href="/app/parent/child" asChild>
          <a className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5">
            Full view <ChevronRight className="w-3 h-3" />
          </a>
        </Link>
      </div>
      <div className="space-y-2.5">
        {mockDevelopmentSummary.map((d) => (
          <div key={d.focusArea} className="flex items-center gap-3">
            <span className="text-[15px]">{d.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[12px] font-medium">{d.focusArea}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{d.currentScore}/{d.targetScore}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${d.progressPct}%`, background: "oklch(0.75 0.12 140)" }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Announcements preview                                                        */
/* -------------------------------------------------------------------------- */

function AnnouncementsPreview() {
  const { data: raw = [], isLoading } = useAnnouncements();
  const all = raw.map((a) => ({ ...a, author: a.authorName }));
  const pinned = all.filter((a) => a.pinned);
  const recent = all.filter((a) => !a.pinned).slice(0, 2);
  const items = [...pinned, ...recent].slice(0, 3);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden h-[160px] flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-muted border-t-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-1.5 font-semibold text-[13px]">
          <Bell className="w-4 h-4" /> Announcements
        </div>
        <Link href="/app/parent/announcements" asChild>
          <a className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5">
            All <ChevronRight className="w-3 h-3" />
          </a>
        </Link>
      </div>
      <div className="divide-y divide-border/50">
        {items.map((a) => (
          <Link key={a.id} href="/app/parent/announcements" asChild>
            <a className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
              {a.priority === "urgent" ? (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "oklch(0.68 0.22 25)" }} />
              ) : (
                <Bell className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium truncate">{a.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {a.author} · {formatPostedAt(a.publishedAt)}
                </div>
              </div>
              {a.pinned && (
                <Badge variant="secondary" className="text-[9px] shrink-0">Pinned</Badge>
              )}
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                    */
/* -------------------------------------------------------------------------- */

export default function ParentDashboard() {
  const { user } = useAuth();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Family Portal"
        title={`Welcome, ${user?.name?.split(" ")[0] ?? "Family"}`}
        subtitle="Stay connected to your athlete's program."
      />

      <div className="space-y-5">
        <ChildHero />
        <AthletesSection />
        <ActionNeeded />
        <QuickLinks />

        {/* Player summary quick link (single-child) */}
        {ACTIVE_GUARDIAN.linkedPlayerIds.length === 1 && (
          <Link href={`/app/parent/player/${ACTIVE_GUARDIAN.linkedPlayerIds[0]}/summary`} asChild>
            <a
              className="flex items-center justify-between rounded-xl border px-4 py-3.5 hover:border-primary/40 transition-all"
              style={{
                borderColor: "oklch(0.22 0.01 260)",
                background: "oklch(0.12 0.005 260)",
              }}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4" style={{ color: "oklch(0.72 0.18 290)" }} />
                <div>
                  <p className="text-[13px] font-semibold">
                    {GUARDIAN_PLAYER_PROFILES[ACTIVE_GUARDIAN.linkedPlayerIds[0]]?.name ?? "Athlete"} — Development Summary
                  </p>
                  <p className="text-[11px] text-muted-foreground">Goals, progress, and upcoming milestones</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </a>
          </Link>
        )}

        <div className="grid lg:grid-cols-2 gap-5">
          <div className="space-y-5">
            <NextEvent />
            <DevSummary />
          </div>
          <AnnouncementsPreview />
        </div>
      </div>
    </AppShell>
  );
}
