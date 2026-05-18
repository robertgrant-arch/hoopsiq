/**
 * BroadcastPage — /app/coach/program/broadcast
 *
 * Segmented announcement composer with live recipient preview.
 * Satisfies AC #3: targeting "Varsity parents" → only Varsity guardians.
 *
 * Composer sections:
 *   1. Program selector (defaults to first coach program)
 *   2. Target audience: all / players / parents / coaches
 *   3. Channel: app / email / sms / all
 *   4. Title + body
 *   5. Schedule or send now
 *   6. Live recipient preview panel
 */

import React, { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Users,
  GraduationCap,
  UserCheck,
  Megaphone,
  Smartphone,
  Mail,
  MessageSquare,
  Radio,
  Send,
  Clock,
  ChevronDown,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  PROGRAMS,
  getCoachPrograms,
  buildRecipientList,
  PROGRAM_LEVEL_LABEL,
  type BroadcastTargetRole,
  type AnnouncementChannel,
  type BroadcastRecipient,
} from "@/lib/mock/program-ops";

/* ─── Colour tokens ──────────────────────────────────────────────────────────── */

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const MUTED   = "oklch(0.55 0.02 260)";

/* ─── PROGRAM LEVEL hue map ──────────────────────────────────────────────────── */

const LEVEL_HUE: Record<string, number> = {
  varsity:   290,
  jv:        200,
  freshman:  140,
  aau_17u:   25,
  aau_15u:   50,
  aau_13u:   75,
};

/* ─── Role option ────────────────────────────────────────────────────────────── */

interface RoleOption {
  value: BroadcastTargetRole;
  label: string;
  description: string;
  icon: React.ReactElement;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: "all",
    label: "Everyone",
    description: "Players, parents, and coaches",
    icon: <Radio className="w-4 h-4" />,
  },
  {
    value: "players",
    label: "Players only",
    description: "Rostered athletes",
    icon: <GraduationCap className="w-4 h-4" />,
  },
  {
    value: "parents",
    label: "Parents / guardians",
    description: "Primary contacts for each player",
    icon: <Users className="w-4 h-4" />,
  },
  {
    value: "coaches",
    label: "Coaches only",
    description: "Staff on this program",
    icon: <UserCheck className="w-4 h-4" />,
  },
];

/* ─── Channel option ─────────────────────────────────────────────────────────── */

interface ChannelOption {
  value: AnnouncementChannel;
  label: string;
  icon: React.ReactElement;
}

const CHANNEL_OPTIONS: ChannelOption[] = [
  { value: "app",   label: "In-app",        icon: <Smartphone className="w-3.5 h-3.5" /> },
  { value: "email", label: "Email",          icon: <Mail className="w-3.5 h-3.5" /> },
  { value: "sms",   label: "SMS",            icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { value: "all",   label: "All channels",   icon: <Radio className="w-3.5 h-3.5" /> },
];

/* ─── Recipient row ──────────────────────────────────────────────────────────── */

function RecipientRow({ recipient }: { recipient: BroadcastRecipient }): React.ReactElement {
  const roleColor =
    recipient.role === "player"  ? PRIMARY :
    recipient.role === "parent"  ? SUCCESS :
    WARNING;

  return (
    <div className="flex items-center gap-3 py-2">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
        style={{ background: `${roleColor}20`, color: roleColor }}
      >
        {recipient.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-medium truncate" style={{ color: "oklch(0.88 0.01 260)" }}>
          {recipient.name}
        </div>
        <div className="text-[11px]" style={{ color: MUTED }}>
          {recipient.email}
        </div>
      </div>
      <span
        className="text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize shrink-0"
        style={{ background: `${roleColor}15`, color: roleColor }}
      >
        {recipient.role}
      </span>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────────── */

export default function BroadcastPage(): React.ReactElement {
  const coachPrograms = getCoachPrograms();
  const allPrograms   = PROGRAMS; // show all for selection; coach may only manage some

  const [programId,   setProgramId]   = useState(coachPrograms[0]?.id ?? PROGRAMS[0].id);
  const [targetRole,  setTargetRole]  = useState<BroadcastTargetRole>("all");
  const [channel,     setChannel]     = useState<AnnouncementChannel>("app");
  const [title,       setTitle]       = useState("");
  const [body,        setBody]        = useState("");
  const [scheduleMode, setScheduleMode] = useState(false);
  const [sending,     setSending]     = useState(false);
  const [sent,        setSent]        = useState(false);
  const [showRecipients, setShowRecipients] = useState(false);

  const program = allPrograms.find((p) => p.id === programId) ?? allPrograms[0];
  const hue     = LEVEL_HUE[program.level] ?? 290;
  const levelColor = `oklch(0.72 0.18 ${hue})`;

  const recipients: BroadcastRecipient[] = useMemo(
    () => buildRecipientList(programId, targetRole),
    [programId, targetRole],
  );

  const canSend = title.trim().length > 0 && body.trim().length > 0 && recipients.length > 0;

  function handleSend(): void {
    if (!canSend) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      toast.success(
        `Message sent to ${recipients.length} recipient${recipients.length !== 1 ? "s" : ""}`,
      );
    }, 800);
  }

  /* ── Success state ──────────────────────────────────────────────────────── */
  if (sent) {
    return (
      <div className="min-h-screen" style={{ background: "oklch(0.12 0.01 260)", color: "oklch(0.93 0.01 260)" }}>
        <div
          className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b"
          style={{ background: "oklch(0.14 0.01 260)", borderColor: "oklch(0.22 0.01 260)" }}
        >
          <Link href="/app/coach/program">
            <a className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-4 h-4" style={{ color: MUTED }} />
            </a>
          </Link>
          <span className="text-[15px] font-semibold">Broadcast</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-5 px-6 py-20">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: `${SUCCESS}20` }}
          >
            <CheckCircle2 className="w-8 h-8" style={{ color: SUCCESS }} />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-[20px] font-bold">Message sent!</h2>
            <p className="text-[14px]" style={{ color: MUTED }}>
              Delivered to {recipients.length} {targetRole === "all" ? "recipients" : targetRole} in{" "}
              <span style={{ color: levelColor }}>{PROGRAM_LEVEL_LABEL[program.level]}</span>
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-sm">
            <Link href="/app/coach/program">
              <a
                className="w-full text-center py-2.5 rounded-lg text-[13px] font-semibold"
                style={{ background: PRIMARY, color: "#fff" }}
              >
                Back to Program Hub
              </a>
            </Link>
            <button
              onClick={() => {
                setSent(false);
                setTitle("");
                setBody("");
              }}
              className="w-full py-2.5 rounded-lg text-[13px] font-semibold border"
              style={{ borderColor: "oklch(0.28 0.015 260)", color: "oklch(0.75 0.01 260)" }}
            >
              Send another
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Composer layout ─────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background: "oklch(0.12 0.01 260)", color: "oklch(0.93 0.01 260)" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 border-b"
        style={{ background: "oklch(0.14 0.01 260)", borderColor: "oklch(0.22 0.01 260)" }}
      >
        <div className="flex items-center gap-3">
          <Link href="/app/coach/program">
            <a className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-4 h-4" style={{ color: MUTED }} />
            </a>
          </Link>
          <div>
            <span className="text-[15px] font-semibold">New Broadcast</span>
            <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
              Send to selected program audience
            </p>
          </div>
        </div>
        <Megaphone className="w-4 h-4" style={{ color: MUTED }} />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Program selector ─────────────────────────────────────────────── */}
        <div className="space-y-2">
          <label className="text-[12.5px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
            Program
          </label>
          <div className="relative">
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="w-full appearance-none rounded-xl border px-4 py-3 text-[13.5px] font-medium pr-9 focus:outline-none focus:ring-1"
              style={{
                background: "oklch(0.16 0.015 260)",
                borderColor: "oklch(0.28 0.015 260)",
                color: "oklch(0.92 0.01 260)",
              }}
            >
              {allPrograms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.season}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: MUTED }} />
          </div>
          {/* Level badge */}
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide"
            style={{ background: `${levelColor}20`, color: levelColor }}
          >
            {PROGRAM_LEVEL_LABEL[program.level]} · {program.rosterCount} players
          </span>
        </div>

        {/* ── Target audience ───────────────────────────────────────────────── */}
        <div className="space-y-2">
          <label className="text-[12.5px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
            Send to
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ROLE_OPTIONS.map((opt) => {
              const active = targetRole === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTargetRole(opt.value)}
                  className="flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all"
                  style={{
                    borderColor: active ? PRIMARY : "oklch(0.28 0.015 260)",
                    background:  active ? `${PRIMARY}15` : "oklch(0.16 0.015 260)",
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: active ? `${PRIMARY}30` : "oklch(0.20 0.01 260)", color: active ? PRIMARY : MUTED }}
                  >
                    {opt.icon}
                  </div>
                  <div>
                    <div className="text-[12.5px] font-semibold" style={{ color: active ? "oklch(0.93 0.01 260)" : "oklch(0.80 0.01 260)" }}>
                      {opt.label}
                    </div>
                    <div className="text-[10.5px]" style={{ color: MUTED }}>
                      {opt.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Channel ───────────────────────────────────────────────────────── */}
        <div className="space-y-2">
          <label className="text-[12.5px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
            Channel
          </label>
          <div className="flex gap-2 flex-wrap">
            {CHANNEL_OPTIONS.map((opt) => {
              const active = channel === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setChannel(opt.value)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-semibold transition-all"
                  style={{
                    borderColor: active ? PRIMARY : "oklch(0.28 0.015 260)",
                    background:  active ? `${PRIMARY}15` : "oklch(0.16 0.015 260)",
                    color: active ? PRIMARY : MUTED,
                  }}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Message ───────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <label className="text-[12.5px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
            Message
          </label>
          <input
            type="text"
            placeholder="Subject / title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 text-[14px] font-semibold focus:outline-none focus:ring-1"
            style={{
              background: "oklch(0.16 0.015 260)",
              borderColor: "oklch(0.28 0.015 260)",
              color: "oklch(0.93 0.01 260)",
              caretColor: PRIMARY,
            }}
          />
          <textarea
            placeholder="Write your message here…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="w-full rounded-xl border px-4 py-3 text-[13px] resize-none focus:outline-none focus:ring-1"
            style={{
              background: "oklch(0.16 0.015 260)",
              borderColor: "oklch(0.28 0.015 260)",
              color: "oklch(0.88 0.01 260)",
              caretColor: PRIMARY,
            }}
          />
          <div className="flex justify-end">
            <span className="text-[11px]" style={{ color: body.length > 500 ? "oklch(0.78 0.16 75)" : MUTED }}>
              {body.length} / 500 chars
            </span>
          </div>
        </div>

        {/* ── Recipients preview ───────────────────────────────────────────── */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: "oklch(0.26 0.015 260)" }}
        >
          <button
            className="w-full flex items-center justify-between px-4 py-3"
            style={{ background: "oklch(0.15 0.01 260)" }}
            onClick={() => setShowRecipients((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" style={{ color: MUTED }} />
              <span className="text-[13px] font-semibold" style={{ color: "oklch(0.85 0.01 260)" }}>
                Recipient preview
              </span>
              {/* AC #3 indicator */}
              {targetRole === "parents" && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
                  style={{ background: `${SUCCESS}20`, color: SUCCESS }}
                >
                  {PROGRAM_LEVEL_LABEL[program.level]} parents only ✓
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[12.5px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: `${PRIMARY}20`, color: PRIMARY }}
              >
                {recipients.length}
              </span>
              <ChevronDown
                className="w-4 h-4 transition-transform"
                style={{ color: MUTED, transform: showRecipients ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </div>
          </button>

          {showRecipients && (
            <div
              className="divide-y max-h-64 overflow-y-auto px-4"
              style={{ borderColor: "oklch(0.22 0.01 260)" }}
            >
              {recipients.length === 0 ? (
                <p className="py-4 text-[13px] text-center" style={{ color: MUTED }}>
                  No recipients match the current filter.
                </p>
              ) : (
                recipients.map((r) => <RecipientRow key={r.id} recipient={r} />)
              )}
            </div>
          )}
        </div>

        {/* ── Send / schedule bar ──────────────────────────────────────────── */}
        <div className="flex gap-3 pt-1 pb-8">
          <button
            onClick={() => setScheduleMode((v) => !v)}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl border text-[13px] font-semibold transition-all"
            style={{
              borderColor: scheduleMode ? PRIMARY : "oklch(0.28 0.015 260)",
              background:  scheduleMode ? `${PRIMARY}15` : "oklch(0.16 0.015 260)",
              color: scheduleMode ? PRIMARY : MUTED,
            }}
          >
            <Clock className="w-4 h-4" />
            Schedule
          </button>
          <button
            onClick={handleSend}
            disabled={!canSend || sending}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-bold transition-opacity"
            style={{
              background: canSend ? PRIMARY : "oklch(0.25 0.01 260)",
              color: canSend ? "#fff" : MUTED,
              opacity: sending ? 0.7 : 1,
              cursor: canSend ? "pointer" : "not-allowed",
            }}
          >
            {sending ? (
              "Sending…"
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send now
                {recipients.length > 0 && (
                  <span
                    className="ml-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.2)" }}
                  >
                    {recipients.length}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
