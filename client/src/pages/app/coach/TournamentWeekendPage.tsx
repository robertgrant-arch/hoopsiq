/**
 * TournamentWeekendPage — /app/coach/program/tournament/:id
 *
 * Renders a full TournamentWeekend with:
 *   - 3 pool-play games, each with court, location, opponent, time (AC #2 ✓)
 *   - Per-game readiness reminders (AC #2 ✓)
 *   - Hotel & transport logistics
 *   - Packing checklist
 *   - Emergency contact
 */

import React, { useState } from "react";
import { Link, useParams } from "wouter";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Hotel,
  Bus,
  Backpack,
  Phone,
  ChevronDown,
  CheckCircle2,
  Circle,
  Trophy,
  AlertTriangle,
  CalendarDays,
} from "lucide-react";
import { SOUTH_TEXAS_SHOWCASE, type TournamentGame, type TournamentWeekend } from "@/lib/mock/program-ops";

/* ─── Colour tokens ──────────────────────────────────────────────────────────── */

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";

/* ─── Section header ─────────────────────────────────────────────────────────── */

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactElement;
  title: string;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: `${PRIMARY}20` }}
      >
        {React.cloneElement(icon as React.ReactElement<{ className?: string; style?: React.CSSProperties }>, { className: "w-3.5 h-3.5", style: { color: PRIMARY } })}
      </div>
      <span
        className="text-[11.5px] font-bold uppercase tracking-widest"
        style={{ color: PRIMARY }}
      >
        {title}
      </span>
    </div>
  );
}

/* ─── Game card ──────────────────────────────────────────────────────────────── */

function GameCard({ game, index }: { game: TournamentGame; index: number }): React.ReactElement {
  const [expanded, setExpanded] = useState(index === 0);
  const [checkedReminders, setCheckedReminders] = useState<Set<number>>(new Set());

  function toggleReminder(i: number): void {
    setCheckedReminders((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  const resultColor =
    game.result === "win"      ? SUCCESS :
    game.result === "loss"     ? DANGER  :
    WARNING;

  const resultLabel =
    game.result === "win"      ? "W" :
    game.result === "loss"     ? "L" :
    "Upcoming";

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: "oklch(0.24 0.015 260)" }}
    >
      {/* Card header — always visible */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
        style={{ background: "oklch(0.16 0.015 260)" }}
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Game number badge */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-black shrink-0"
          style={{ background: `${PRIMARY}25`, color: PRIMARY }}
        >
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[11px] font-bold uppercase tracking-wide"
              style={{ color: MUTED }}
            >
              {game.roundLabel}
            </span>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: `${resultColor}20`, color: resultColor }}
            >
              {resultLabel}
              {game.score ? ` · ${game.score}` : ""}
            </span>
          </div>
          <div className="text-[14.5px] font-bold mt-0.5" style={{ color: "oklch(0.93 0.01 260)" }}>
            vs. {game.opponent}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" style={{ color: MUTED }} />
              <span className="text-[11.5px]" style={{ color: MUTED }}>
                {game.time}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" style={{ color: MUTED }} />
              <span className="text-[11.5px]" style={{ color: MUTED }}>
                {game.court} · {game.location}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px]" style={{ color: MUTED }}>
            {checkedReminders.size}/{game.readinessReminders.length}
          </span>
          <ChevronDown
            className="w-4 h-4 transition-transform"
            style={{ color: MUTED, transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </div>
      </button>

      {/* Expanded: readiness reminders */}
      {expanded && (
        <div
          className="px-4 py-3 border-t space-y-2"
          style={{ borderColor: "oklch(0.22 0.01 260)", background: "oklch(0.14 0.01 260)" }}
        >
          <p className="text-[11.5px] font-semibold uppercase tracking-wide mb-2" style={{ color: MUTED }}>
            Readiness checklist
          </p>
          {game.readinessReminders.map((reminder, i) => {
            const checked = checkedReminders.has(i);
            return (
              <button
                key={i}
                onClick={() => toggleReminder(i)}
                className="w-full flex items-start gap-3 text-left group"
              >
                {checked ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: SUCCESS }} />
                ) : (
                  <Circle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "oklch(0.35 0.01 260)" }} />
                )}
                <span
                  className="text-[12.5px] leading-relaxed"
                  style={{
                    color: checked ? MUTED : "oklch(0.85 0.01 260)",
                    textDecoration: checked ? "line-through" : "none",
                  }}
                >
                  {reminder}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Info row ───────────────────────────────────────────────────────────────── */

function InfoRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <span className="text-[12px] font-semibold w-28 shrink-0" style={{ color: MUTED }}>
        {label}
      </span>
      <span className="text-[12.5px]" style={{ color: "oklch(0.88 0.01 260)" }}>
        {value}
      </span>
    </div>
  );
}

/* ─── Packing checklist ──────────────────────────────────────────────────────── */

function PackingChecklist({ items }: { items: string[] }): React.ReactElement {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  function toggle(i: number): void {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const done = checked.has(i);
        return (
          <button
            key={i}
            onClick={() => toggle(i)}
            className="w-full flex items-center gap-3 text-left"
          >
            {done ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: SUCCESS }} />
            ) : (
              <Circle className="w-4 h-4 shrink-0" style={{ color: "oklch(0.35 0.01 260)" }} />
            )}
            <span
              className="text-[12.5px]"
              style={{
                color: done ? MUTED : "oklch(0.85 0.01 260)",
                textDecoration: done ? "line-through" : "none",
              }}
            >
              {item}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Lookup helpers ─────────────────────────────────────────────────────────── */

const TOURNAMENTS: Record<string, TournamentWeekend> = {
  tourn_southtx_2026: SOUTH_TEXAS_SHOWCASE,
};

/* ─── Main page ──────────────────────────────────────────────────────────────── */

export default function TournamentWeekendPage(): React.ReactElement {
  const params = useParams<{ id: string }>();
  const tournament = TOURNAMENTS[params.id ?? ""] ?? SOUTH_TEXAS_SHOWCASE;

  const winsCount      = tournament.games.filter((g) => g.result === "win").length;
  const lossCount      = tournament.games.filter((g) => g.result === "loss").length;
  const upcomingCount  = tournament.games.filter((g) => g.result === "upcoming").length;

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.12 0.01 260)", color: "oklch(0.93 0.01 260)" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: "oklch(0.14 0.01 260)", borderColor: "oklch(0.22 0.01 260)" }}
      >
        <Link href="/app/coach/program">
          <a className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-4 h-4" style={{ color: MUTED }} />
          </a>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-semibold truncate">{tournament.name}</h1>
          <p className="text-[11px] mt-0.5 truncate" style={{ color: MUTED }}>
            {tournament.venue} · {tournament.city}, {tournament.state}
          </p>
        </div>
        <Trophy className="w-4 h-4 shrink-0" style={{ color: WARNING }} />
      </div>

      {/* Hero */}
      <div
        className="px-4 py-5 border-b"
        style={{ borderColor: "oklch(0.22 0.01 260)", background: "oklch(0.14 0.01 260)" }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4" style={{ color: MUTED }} />
            <span className="text-[12.5px]" style={{ color: MUTED }}>
              {tournament.startDate} — {tournament.endDate}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" style={{ color: MUTED }} />
            <span className="text-[12.5px]" style={{ color: MUTED }}>
              {tournament.city}, {tournament.state}
            </span>
          </div>
        </div>
        {/* Record summary */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[22px] font-black" style={{ color: SUCCESS }}>{winsCount}</span>
            <span className="text-[12px] font-semibold" style={{ color: MUTED }}>Wins</span>
          </div>
          <div className="w-px h-8" style={{ background: "oklch(0.25 0.01 260)" }} />
          <div className="flex items-center gap-1.5">
            <span className="text-[22px] font-black" style={{ color: DANGER }}>{lossCount}</span>
            <span className="text-[12px] font-semibold" style={{ color: MUTED }}>Losses</span>
          </div>
          <div className="w-px h-8" style={{ background: "oklch(0.25 0.01 260)" }} />
          <div className="flex items-center gap-1.5">
            <span className="text-[22px] font-black" style={{ color: WARNING }}>{upcomingCount}</span>
            <span className="text-[12px] font-semibold" style={{ color: MUTED }}>
              {upcomingCount === 1 ? "Upcoming" : "Upcoming"}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">

        {/* ── Games ─────────────────────────────────────────────────────────── */}
        <section>
          <SectionHeader icon={<Trophy />} title={`Pool Play · ${tournament.games.length} games`} />
          <div className="space-y-3">
            {tournament.games.map((game, i) => (
              <GameCard key={game.id} game={game} index={i} />
            ))}
          </div>
        </section>

        {/* ── Transport ─────────────────────────────────────────────────────── */}
        {tournament.transport && (
          <section>
            <SectionHeader icon={<Bus />} title="Transport" />
            <div
              className="rounded-xl border divide-y overflow-hidden"
              style={{ borderColor: "oklch(0.24 0.015 260)" }}
            >
              <div className="px-4 py-3" style={{ background: "oklch(0.16 0.015 260)" }}>
                <InfoRow
                  label="Departs"
                  value={`${new Date(tournament.transport.departureTime).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`}
                />
                <InfoRow label="From" value={tournament.transport.departureLocation} />
                <InfoRow
                  label="Returns"
                  value={`${new Date(tournament.transport.returnTime).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`}
                />
              </div>
              <div
                className="px-4 py-2.5 flex items-center gap-2"
                style={{ background: "oklch(0.14 0.01 260)" }}
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: WARNING }} />
                <span className="text-[11.5px]" style={{ color: WARNING }}>
                  Players must arrive 15 minutes before departure
                </span>
              </div>
            </div>
          </section>
        )}

        {/* ── Hotel ─────────────────────────────────────────────────────────── */}
        {tournament.hotel && (
          <section>
            <SectionHeader icon={<Hotel />} title="Hotel" />
            <div
              className="rounded-xl border px-4 py-4"
              style={{ borderColor: "oklch(0.24 0.015 260)", background: "oklch(0.16 0.015 260)" }}
            >
              <div className="text-[14px] font-bold mb-2" style={{ color: "oklch(0.93 0.01 260)" }}>
                {tournament.hotel.name}
              </div>
              <InfoRow label="Address"    value={tournament.hotel.address} />
              <InfoRow label="Check-in"   value={tournament.hotel.checkIn} />
              <InfoRow label="Check-out"  value={tournament.hotel.checkOut} />
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: `${PRIMARY}15` }}>
                <span className="text-[11px] font-semibold" style={{ color: MUTED }}>Group code</span>
                <code className="text-[13px] font-bold" style={{ color: PRIMARY }}>
                  {tournament.hotel.groupCode}
                </code>
              </div>
            </div>
          </section>
        )}

        {/* ── Packing list ──────────────────────────────────────────────────── */}
        <section>
          <SectionHeader icon={<Backpack />} title="Packing list" />
          <div
            className="rounded-xl border px-4 py-4"
            style={{ borderColor: "oklch(0.24 0.015 260)", background: "oklch(0.16 0.015 260)" }}
          >
            <PackingChecklist items={tournament.packingReminders} />
          </div>
        </section>

        {/* ── Emergency contact ─────────────────────────────────────────────── */}
        <section className="pb-8">
          <SectionHeader icon={<Phone />} title="Emergency contact" />
          <div
            className="rounded-xl border px-4 py-4 flex items-center gap-4"
            style={{ borderColor: "oklch(0.24 0.015 260)", background: "oklch(0.16 0.015 260)" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
              style={{ background: `${DANGER}20`, color: DANGER }}
            >
              {tournament.emergencyContact.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <div className="text-[14px] font-semibold" style={{ color: "oklch(0.93 0.01 260)" }}>
                {tournament.emergencyContact.name}
              </div>
              <div className="text-[12.5px]" style={{ color: MUTED }}>
                {tournament.emergencyContact.phone}
              </div>
            </div>
            <a
              href={`tel:${tournament.emergencyContact.phone.replace(/[^+\d]/g, "")}`}
              className="ml-auto px-3 py-1.5 rounded-lg text-[12.5px] font-semibold"
              style={{ background: `${DANGER}20`, color: DANGER }}
            >
              Call
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
