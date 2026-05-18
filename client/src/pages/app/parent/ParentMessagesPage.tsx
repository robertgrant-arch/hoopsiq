/**
 * ParentMessagesPage — unified inbox for parent portal.
 *
 * Two modes toggled by tabs:
 *   • Announcements — org-wide broadcasts with per-guardian read receipts
 *   • Messages      — direct coach → guardian threads with inline reply
 *
 * Read receipts are tracked in local state (mock) and persisted to
 * ANNOUNCEMENT_READ_RECEIPTS in production. Unread dot disappears on open.
 *
 * Private acceptance criterion: this page never surfaces private coach notes —
 * those are only controlled via VisibilityControls on the player summary page.
 */

import React, { useState } from "react";
import {
  Bell,
  MessageSquare,
  ChevronRight,
  AlertCircle,
  Info,
  Pin,
  CheckCircle2,
  Clock,
  Send,
  User,
  ArrowLeft,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { mockAnnouncements } from "@/features/parent/mock";
import {
  ACTIVE_GUARDIAN,
  DIRECT_MESSAGES,
  getThreadsForGuardian,
  isAnnouncementRead,
  getReadAt,
  type DirectMessage,
  type MessageThread,
} from "@/features/parent/guardian";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER = "oklch(0.68 0.22 25)";
const MUTED = "oklch(0.55 0.02 260)";

const PRIORITY_CONFIG = {
  urgent: {
    label: "Urgent",
    Icon: AlertCircle,
    color: DANGER,
    bg: "oklch(0.68 0.22 25 / 0.07)",
    border: "oklch(0.68 0.22 25 / 0.28)",
  },
  normal: {
    label: "Update",
    Icon: Bell,
    color: MUTED,
    bg: "transparent",
    border: "oklch(0.24 0.01 260)",
  },
  info: {
    label: "Info",
    Icon: Info,
    color: "oklch(0.65 0.15 230)",
    bg: "oklch(0.65 0.15 230 / 0.07)",
    border: "oklch(0.65 0.15 230 / 0.25)",
  },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor(diff / 3_600_000);
  if (days === 0 && hours === 0) return "Just now";
  if (days === 0) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFull(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Announcement card ────────────────────────────────────────────────────────

function AnnouncementCard({
  ann,
  isRead,
  readAt,
  onMarkRead,
}: {
  ann: (typeof mockAnnouncements)[0];
  isRead: boolean;
  readAt: string | null;
  onMarkRead: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = PRIORITY_CONFIG[ann.priority];

  function handleOpen() {
    setExpanded((p) => !p);
    if (!isRead) onMarkRead(ann.id);
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-200"
      style={{
        borderColor: cfg.border,
        background: expanded ? cfg.bg : isRead ? "transparent" : cfg.bg,
      }}
    >
      <button
        type="button"
        onClick={handleOpen}
        className="w-full text-left px-4 py-3.5 flex items-start gap-3"
      >
        {/* Priority icon */}
        <span
          className="mt-0.5 shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: cfg.color.replace(")", " / 0.12)") }}
        >
          <cfg.Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {!isRead && (
                <span
                  className="w-2 h-2 rounded-full shrink-0 mt-0.5"
                  style={{ background: ACCENT }}
                />
              )}
              {ann.pinned && (
                <Pin className="w-3 h-3 shrink-0" style={{ color: MUTED }} />
              )}
              <p className="text-[13.5px] font-semibold leading-tight">{ann.title}</p>
            </div>
            <span className="text-[11px] shrink-0" style={{ color: MUTED }}>
              {timeAgo(ann.postedAt)}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <User className="w-3 h-3" style={{ color: MUTED }} />
            <span className="text-[11px]" style={{ color: MUTED }}>
              {ann.author} · {ann.authorRole}
            </span>
          </div>

          {!expanded && (
            <p className="text-[12.5px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
              {ann.body}
            </p>
          )}
        </div>

        <ChevronRight
          className="w-4 h-4 shrink-0 mt-0.5 transition-transform duration-200"
          style={{
            color: MUTED,
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[oklch(0.22_0.01_260)]">
          <p className="text-[13.5px] leading-relaxed pt-3">{ann.body}</p>

          {/* Tags */}
          {ann.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ann.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                  style={{
                    background: ACCENT.replace(")", " / 0.12)"),
                    color: ACCENT,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Read receipt row */}
          <div className="flex items-center gap-2 text-[11px]" style={{ color: MUTED }}>
            {isRead ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: SUCCESS }} />
                <span>Read {readAt ? formatFull(readAt) : ""}</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5" />
                <span>Marked as read now</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Announcements tab ────────────────────────────────────────────────────────

function AnnouncementsTab({ guardianId }: { guardianId: string }) {
  const [readSet, setReadSet] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const ann of mockAnnouncements) {
      if (isAnnouncementRead(ann.id, guardianId)) initial.add(ann.id);
    }
    return initial;
  });

  const [readTimes, setReadTimes] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const ann of mockAnnouncements) {
      const t = getReadAt(ann.id, guardianId);
      if (t) map[ann.id] = t;
    }
    return map;
  });

  function markRead(id: string) {
    const now = new Date().toISOString();
    setReadSet((prev) => new Set([...Array.from(prev), id]));
    setReadTimes((prev) => ({ ...prev, [id]: now }));
  }

  const unreadCount = mockAnnouncements.filter((a) => !readSet.has(a.id)).length;

  // Pinned first, then newest-first
  const sorted = [...mockAnnouncements].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.postedAt.localeCompare(a.postedAt);
  });

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <p className="text-[12px] px-1" style={{ color: MUTED }}>
          {unreadCount} unread announcement{unreadCount !== 1 ? "s" : ""}
        </p>
      )}
      {sorted.map((ann) => (
        <AnnouncementCard
          key={ann.id}
          ann={ann}
          isRead={readSet.has(ann.id)}
          readAt={readTimes[ann.id] ?? null}
          onMarkRead={markRead}
        />
      ))}
    </div>
  );
}

// ─── Thread detail view ───────────────────────────────────────────────────────

function ThreadDetail({
  thread,
  guardianId,
  onBack,
}: {
  thread: MessageThread;
  guardianId: string;
  onBack: () => void;
}) {
  const [reply, setReply] = useState("");
  const [sent, setSent] = useState(false);

  function handleSend() {
    if (!reply.trim()) return;
    setSent(true);
    setReply("");
    toast.success("Message sent to " + thread.messages[0].from.name);
  }

  const messages = [...thread.messages].sort((a, b) =>
    a.sentAt.localeCompare(b.sentAt)
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted/30 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-[11px] uppercase tracking-widest font-mono" style={{ color: ACCENT }}>
            Message Thread
          </p>
          <h2 className="text-[16px] font-bold leading-tight">{thread.subject}</h2>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-3">
        {messages.map((msg) => {
          const isMine = msg.from.id === guardianId || msg.from.role === "guardian";
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[85%] rounded-2xl px-4 py-3 space-y-1"
                style={
                  isMine
                    ? {
                        background: ACCENT.replace(")", " / 0.15)"),
                        borderBottomRightRadius: 4,
                      }
                    : {
                        background: "oklch(0.18 0.005 260)",
                        borderBottomLeftRadius: 4,
                      }
                }
              >
                {!isMine && (
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: ACCENT }}
                  >
                    {msg.from.name}
                  </p>
                )}
                <p className="text-[13.5px] leading-relaxed">{msg.body}</p>
                <p className="text-[10px]" style={{ color: MUTED }}>
                  {formatFull(msg.sentAt)}
                  {msg.readAt && !isMine && (
                    <span className="ml-2">
                      <CheckCircle2
                        className="inline w-3 h-3"
                        style={{ color: SUCCESS }}
                      />{" "}
                      Read
                    </span>
                  )}
                </p>
              </div>
            </div>
          );
        })}

        {sent && (
          <div className="flex justify-end">
            <div
              className="max-w-[85%] rounded-2xl px-4 py-3"
              style={{
                background: ACCENT.replace(")", " / 0.15)"),
                borderBottomRightRadius: 4,
              }}
            >
              <p className="text-[13.5px] leading-relaxed">{reply || "Thanks for reaching out."}</p>
              <p className="text-[10px] mt-1" style={{ color: MUTED }}>
                Just now · Sending…
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Reply box */}
      {!sent && (
        <div className="space-y-2 pt-1">
          <textarea
            rows={3}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type a reply…"
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-[13px] resize-none focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
          />
          <Button
            className="gap-2 w-full min-h-[48px] font-semibold"
            style={{ background: ACCENT, color: "white" }}
            onClick={handleSend}
            disabled={!reply.trim()}
          >
            <Send className="w-4 h-4" />
            Send Reply
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Thread row ───────────────────────────────────────────────────────────────

function ThreadRow({
  thread,
  guardianId,
  onClick,
}: {
  thread: MessageThread;
  guardianId: string;
  onClick: () => void;
}) {
  const latest = thread.messages[0];
  const isMine = latest.from.id === guardianId || latest.from.role === "guardian";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-left hover:border-primary/40 transition-all active:scale-[0.99]"
      style={{
        borderColor: thread.isRead ? "oklch(0.22 0.01 260)" : ACCENT.replace(")", " / 0.30)"),
        background: thread.isRead
          ? "oklch(0.12 0.005 260)"
          : ACCENT.replace(")", " / 0.05)"),
      }}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 text-white"
        style={{ background: isMine ? MUTED : ACCENT }}
      >
        {isMine ? "Me" : latest.from.name.slice(0, 2).toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] font-semibold truncate">{thread.subject}</p>
          <span className="text-[10px] shrink-0" style={{ color: MUTED }}>
            {timeAgo(thread.lastMessageAt)}
          </span>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
          {isMine ? "You" : latest.from.name}
        </p>
        <p className="text-[12px] text-muted-foreground mt-1 line-clamp-1 leading-relaxed">
          {latest.body}
        </p>
      </div>

      {/* Unread dot */}
      {!thread.isRead && (
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
          style={{ background: ACCENT }}
        />
      )}
    </button>
  );
}

// ─── Messages tab ─────────────────────────────────────────────────────────────

function MessagesTab({ guardianId }: { guardianId: string }) {
  const [activeThread, setActiveThread] = useState<MessageThread | null>(null);
  const threads = getThreadsForGuardian(guardianId);

  if (activeThread) {
    return (
      <ThreadDetail
        thread={activeThread}
        guardianId={guardianId}
        onBack={() => setActiveThread(null)}
      />
    );
  }

  const unreadCount = threads.filter((t) => !t.isRead).length;

  if (threads.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-2">
        <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground" />
        <p className="text-[13px] text-muted-foreground">No messages yet.</p>
        <p className="text-[12px] text-muted-foreground">
          Coaches and program staff will reach out here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <p className="text-[12px] px-1" style={{ color: MUTED }}>
          {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}
        </p>
      )}
      {threads.map((thread) => (
        <ThreadRow
          key={thread.threadId}
          thread={thread}
          guardianId={guardianId}
          onClick={() => setActiveThread(thread)}
        />
      ))}
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar({
  active,
  onSelect,
  announcementUnread,
  messageUnread,
}: {
  active: "announcements" | "messages";
  onSelect: (tab: "announcements" | "messages") => void;
  announcementUnread: number;
  messageUnread: number;
}) {
  return (
    <div
      className="flex rounded-xl overflow-hidden border border-border"
      style={{ background: "oklch(0.12 0.005 260)" }}
    >
      {(["announcements", "messages"] as const).map((tab) => {
        const isActive = active === tab;
        const count = tab === "announcements" ? announcementUnread : messageUnread;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onSelect(tab)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold transition-all duration-150"
            style={
              isActive
                ? { background: ACCENT, color: "white" }
                : { color: MUTED }
            }
          >
            {tab === "announcements" ? (
              <Bell className="w-3.5 h-3.5" />
            ) : (
              <MessageSquare className="w-3.5 h-3.5" />
            )}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {count > 0 && (
              <span
                className="text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                style={
                  isActive
                    ? { background: "white", color: ACCENT }
                    : { background: ACCENT, color: "white" }
                }
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ParentMessagesPage(): React.ReactElement {
  const guardian = ACTIVE_GUARDIAN;
  const [activeTab, setActiveTab] = useState<"announcements" | "messages">("announcements");

  // Derive unread counts
  const announcementUnread = mockAnnouncements.filter(
    (a) => !isAnnouncementRead(a.id, guardian.id)
  ).length;
  const messageUnread = getThreadsForGuardian(guardian.id).filter(
    (t) => !t.isRead
  ).length;

  return (
    <AppShell>
      <div className="px-4 pb-24 max-w-lg mx-auto pt-4 space-y-4">
        <PageHeader
          eyebrow="Family Portal"
          title="Messages"
          subtitle="Announcements from your program and direct messages from coaches."
        />

        <TabBar
          active={activeTab}
          onSelect={setActiveTab}
          announcementUnread={announcementUnread}
          messageUnread={messageUnread}
        />

        {activeTab === "announcements" ? (
          <AnnouncementsTab guardianId={guardian.id} />
        ) : (
          <MessagesTab guardianId={guardian.id} />
        )}
      </div>
    </AppShell>
  );
}
