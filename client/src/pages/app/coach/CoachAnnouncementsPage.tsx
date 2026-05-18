/**
 * CoachAnnouncementsPage — team communication hub for coaches.
 *
 * Coaches compose and manage announcements sent to players, parents, or both.
 * Features: compose form, pinned-first list, audience/priority filters,
 * read receipts, expand/collapse body, and a stats strip.
 */
import { useState, useMemo } from "react";
import {
  Bell,
  Pin,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  X,
  Plus,
  Users,
  Heart,
  BookOpen,
  Check,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  announcements as initialAnnouncements,
  type Announcement,
  type AnnouncementAudience,
  type AnnouncementPriority,
} from "@/features/announcements/mock";

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

const NOW = new Date("2026-05-15T12:00:00Z");

const PRIMARY   = "oklch(0.72 0.18 290)";
const DANGER    = "oklch(0.68 0.22 25)";
const WARNING   = "oklch(0.78 0.16 75)";
const SUCCESS   = "oklch(0.75 0.12 140)";
const BLUE      = "oklch(0.65 0.15 230)";

type FilterTab = "all" | "players" | "parents" | "coaches" | "urgent";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function relativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = NOW.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr  = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1)  return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr  < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7)  return `${diffDay} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function audienceColor(audience: AnnouncementAudience): string {
  switch (audience) {
    case "all":     return PRIMARY;
    case "players": return BLUE;
    case "parents": return SUCCESS;
    case "coaches": return WARNING;
  }
}

function audienceLabel(audience: AnnouncementAudience): string {
  switch (audience) {
    case "all":     return "All";
    case "players": return "Players";
    case "parents": return "Parents";
    case "coaches": return "Coaches";
  }
}

function audienceIcon(audience: AnnouncementAudience) {
  switch (audience) {
    case "all":     return <Users className="w-3 h-3" />;
    case "players": return <BookOpen className="w-3 h-3" />;
    case "parents": return <Heart className="w-3 h-3" />;
    case "coaches": return <Bell className="w-3 h-3" />;
  }
}

/* -------------------------------------------------------------------------- */
/* Stats strip                                                                 */
/* -------------------------------------------------------------------------- */

function StatsStrip({ items }: { items: Announcement[] }) {
  const thisMonth = items.filter((a) => {
    const d = new Date(a.createdAt);
    return d.getFullYear() === NOW.getFullYear() && d.getMonth() === NOW.getMonth();
  });
  const avgReadRate = items.length === 0 ? 0 :
    Math.round(items.reduce((sum, a) => sum + (a.readBy.length / a.recipientCount), 0) / items.length * 100);
  const unread = items.reduce((sum, a) => sum + Math.max(0, a.recipientCount - a.readBy.length), 0);

  const stats = [
    { label: "Sent this month", value: String(thisMonth.length) },
    { label: "Avg read rate",   value: `${avgReadRate}%` },
    { label: "Unread total",    value: String(unread) },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-5">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3 text-center">
          <div className="font-mono font-bold text-xl leading-none mb-1">{s.value}</div>
          <div className="text-[11px] text-muted-foreground">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Compose form                                                                */
/* -------------------------------------------------------------------------- */

type FormState = {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  priority: AnnouncementPriority;
  pinned: boolean;
};

const BLANK_FORM: FormState = {
  title: "",
  body: "",
  audience: "all",
  priority: "normal",
  pinned: false,
};

function ComposeForm({
  onPost,
  onCancel,
}: {
  onPost: (form: FormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(BLANK_FORM);

  const audiences: { value: AnnouncementAudience; label: string }[] = [
    { value: "all",     label: "All" },
    { value: "players", label: "Players only" },
    { value: "parents", label: "Parents only" },
    { value: "coaches", label: "Coaches" },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    onPost(form);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-card p-4 sm:p-5 mb-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold">New Announcement</span>
        <button
          type="button"
          onClick={onCancel}
          className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Title</label>
        <input
          type="text"
          placeholder="Announcement title…"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Body */}
      <div className="space-y-1.5">
        <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Message</label>
        <textarea
          rows={5}
          placeholder="Write your message…"
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      {/* Audience */}
      <div className="space-y-1.5">
        <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Audience</label>
        <div className="flex flex-wrap gap-2">
          {audiences.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, audience: a.value }))}
              className="px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all"
              style={
                form.audience === a.value
                  ? {
                      background: `${audienceColor(a.value).replace(")", " / 0.15)")}`,
                      color: audienceColor(a.value),
                      borderColor: `${audienceColor(a.value).replace(")", " / 0.40)")}`,
                    }
                  : {
                      background: "transparent",
                      color: "oklch(0.55 0.02 260)",
                      borderColor: "var(--border)",
                    }
              }
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Priority + Pin toggles */}
      <div className="flex flex-wrap gap-3">
        {/* Priority */}
        <div className="space-y-1.5 flex-1 min-w-[140px]">
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Priority</label>
          <div className="flex gap-2">
            {(["normal", "urgent"] as AnnouncementPriority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setForm((f) => ({ ...f, priority: p }))}
                className="flex-1 px-3 py-1.5 rounded-full text-[12px] font-medium border capitalize transition-all"
                style={
                  form.priority === p
                    ? p === "urgent"
                      ? { background: `${DANGER.replace(")", " / 0.15)")}`, color: DANGER, borderColor: `${DANGER.replace(")", " / 0.40)")}` }
                      : { background: `${PRIMARY.replace(")", " / 0.12)")}`, color: PRIMARY, borderColor: `${PRIMARY.replace(")", " / 0.40)")}` }
                    : { background: "transparent", color: "oklch(0.55 0.02 260)", borderColor: "var(--border)" }
                }
              >
                {p === "urgent" ? "Urgent" : "Normal"}
              </button>
            ))}
          </div>
        </div>

        {/* Pin toggle */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Pin to top</label>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, pinned: !f.pinned }))}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all"
            style={
              form.pinned
                ? { background: `${WARNING.replace(")", " / 0.12)")}`, color: WARNING, borderColor: `${WARNING.replace(")", " / 0.35)")}` }
                : { background: "transparent", color: "oklch(0.55 0.02 260)", borderColor: "var(--border)" }
            }
          >
            <Pin className="w-3 h-3" />
            {form.pinned ? "Pinned" : "Pin"}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" className="flex-1 sm:flex-none" style={{ background: PRIMARY, color: "#fff" }}>
          Post Announcement
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Announcement card                                                           */
/* -------------------------------------------------------------------------- */

function AnnouncementCard({
  item,
  expanded,
  onToggleExpand,
  onDelete,
}: {
  item: Announcement;
  expanded: boolean;
  onToggleExpand: () => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const readPct = Math.round((item.readBy.length / item.recipientCount) * 100);
  const color = audienceColor(item.audience);

  return (
    <div
      className="rounded-xl border bg-card overflow-hidden transition-all"
      style={{
        borderColor: item.priority === "urgent"
          ? `${DANGER.replace(")", " / 0.30)")}`
          : "var(--border)",
        borderLeftWidth: item.pinned ? "3px" : undefined,
        borderLeftColor: item.pinned ? WARNING : undefined,
      }}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-2 mb-2">
          {/* Badges */}
          <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
            {item.pinned && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: `${WARNING.replace(")", " / 0.15)")}`, color: WARNING }}
              >
                <Pin className="w-2.5 h-2.5" />
                PINNED
              </span>
            )}
            {item.priority === "urgent" && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: `${DANGER.replace(")", " / 0.15)")}`, color: DANGER }}
              >
                <AlertTriangle className="w-2.5 h-2.5" />
                URGENT
              </span>
            )}
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: `${color.replace(")", " / 0.12)")}`, color }}
            >
              {audienceIcon(item.audience)}
              {audienceLabel(item.audience)}
            </span>
          </div>

          {/* Time */}
          <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5">
            {relativeTime(item.createdAt)}
          </span>
        </div>

        {/* Title */}
        <p className="font-semibold text-[14px] leading-snug mb-1.5">{item.title}</p>

        {/* Body */}
        <div className="relative">
          <p
            className={`text-[12px] text-muted-foreground leading-relaxed whitespace-pre-line ${!expanded ? "line-clamp-2" : ""}`}
          >
            {item.body}
          </p>
          {item.body.length > 120 && (
            <button
              onClick={onToggleExpand}
              className="mt-1 text-[11px] font-medium flex items-center gap-0.5 transition-colors"
              style={{ color: PRIMARY }}
            >
              {expanded ? (
                <><ChevronUp className="w-3 h-3" /> Show less</>
              ) : (
                <><ChevronDown className="w-3 h-3" /> Show more</>
              )}
            </button>
          )}
        </div>

        {/* Author */}
        <div className="mt-2.5 text-[11px] text-muted-foreground">
          {item.authorName} · <span className="capitalize">{item.authorRole}</span>
        </div>

        {/* Read receipt */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
            <span>{item.readBy.length} / {item.recipientCount} read</span>
            <span className="font-medium" style={{ color: readPct >= 80 ? SUCCESS : readPct >= 50 ? WARNING : DANGER }}>
              {readPct}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${readPct}%`,
                background: readPct >= 80 ? SUCCESS : readPct >= 50 ? WARNING : DANGER,
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          <button className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            <Pencil className="w-3 h-3" /> Edit
          </button>
          <span className="text-border">·</span>
          {confirmDelete ? (
            <span className="text-[11px] flex items-center gap-1.5">
              <span className="text-muted-foreground">Delete?</span>
              <button
                onClick={() => onDelete(item.id)}
                className="font-semibold transition-colors"
                style={{ color: DANGER }}
              >
                Yes, delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Filter bar                                                                  */
/* -------------------------------------------------------------------------- */

function FilterBar({
  active,
  pinnedOnly,
  onChange,
  onTogglePinned,
}: {
  active: FilterTab;
  pinnedOnly: boolean;
  onChange: (tab: FilterTab) => void;
  onTogglePinned: () => void;
}) {
  const tabs: { value: FilterTab; label: string }[] = [
    { value: "all",     label: "All" },
    { value: "players", label: "Players" },
    { value: "parents", label: "Parents" },
    { value: "coaches", label: "Coaches" },
    { value: "urgent",  label: "Urgent" },
  ];

  return (
    <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
      <div className="flex items-center gap-1 shrink-0">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            className="px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all shrink-0"
            style={
              active === t.value
                ? { background: `${PRIMARY.replace(")", " / 0.14)")}`, color: PRIMARY }
                : { color: "oklch(0.55 0.02 260)" }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-border shrink-0 mx-1" />

      <button
        onClick={onTogglePinned}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium shrink-0 transition-all"
        style={
          pinnedOnly
            ? { background: `${WARNING.replace(")", " / 0.12)")}`, color: WARNING }
            : { color: "oklch(0.55 0.02 260)" }
        }
      >
        {pinnedOnly && <Check className="w-3 h-3" />}
        <Pin className="w-3 h-3" />
        Pinned
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                 */
/* -------------------------------------------------------------------------- */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: `${PRIMARY.replace(")", " / 0.10)")}` }}
      >
        <Bell className="w-6 h-6" style={{ color: PRIMARY }} />
      </div>
      <p className="font-semibold text-[14px] mb-1">No announcements yet</p>
      <p className="text-[12px] text-muted-foreground">Post your first one above.</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function CoachAnnouncementsPage() {
  const [items, setItems]           = useState<Announcement[]>(initialAnnouncements);
  const [composing, setComposing]   = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [expanded, setExpanded]     = useState<Set<string>>(new Set());

  /* Derived list */
  const filtered = useMemo(() => {
    let list = [...items];

    // Pinned first
    list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    if (pinnedOnly) {
      list = list.filter((a) => a.pinned);
    }
    if (activeFilter !== "all") {
      if (activeFilter === "urgent") {
        list = list.filter((a) => a.priority === "urgent");
      } else {
        list = list.filter((a) => a.audience === activeFilter || a.audience === "all");
      }
    }

    return list;
  }, [items, activeFilter, pinnedOnly]);

  function handlePost(form: FormState) {
    const next: Announcement = {
      id:            `ann_new_${Date.now()}`,
      orgId:         "org_barnegat",
      authorId:      "coach_1",
      authorName:    "Coach Marcus",
      authorRole:    "coach",
      title:         form.title,
      body:          form.body,
      audience:      form.audience,
      priority:      form.priority,
      pinned:        form.pinned,
      createdAt:     NOW.toISOString(),
      readBy:        [],
      recipientCount: form.audience === "all" ? 18 : form.audience === "players" ? 12 : form.audience === "parents" ? 10 : 3,
    };
    setItems((prev) => [next, ...prev]);
    setComposing(false);
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((a) => a.id !== id));
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-3xl mx-auto">
        <PageHeader
          eyebrow="Communication"
          title="Announcements"
          subtitle="Post updates to your players, parents, and staff."
          actions={
            !composing ? (
              <Button
                size="sm"
                onClick={() => setComposing(true)}
                className="gap-1.5"
                style={{ background: PRIMARY, color: "#fff" }}
              >
                <Plus className="w-4 h-4" />
                New Announcement
              </Button>
            ) : undefined
          }
        />

        <StatsStrip items={items} />

        {composing && (
          <ComposeForm
            onPost={handlePost}
            onCancel={() => setComposing(false)}
          />
        )}

        <FilterBar
          active={activeFilter}
          pinnedOnly={pinnedOnly}
          onChange={setActiveFilter}
          onTogglePinned={() => setPinnedOnly((v) => !v)}
        />

        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <AnnouncementCard
                key={item.id}
                item={item}
                expanded={expanded.has(item.id)}
                onToggleExpand={() => toggleExpand(item.id)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
