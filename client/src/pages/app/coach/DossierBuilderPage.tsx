/**
 * DossierBuilderPage — /app/coach/players/:playerId/dossier
 *
 * Coach-side dossier editor with:
 *  - Per-section visibility controls (public / private / on_request)
 *  - Coach verification badges for HoopsOS-sourced data
 *  - Preview mode showing the public view
 *  - Share link generation (public + private)
 *  - PDF export placeholder
 *  - Player/parent review state workflow
 *  - View analytics summary
 *
 * Design: two-column on wide screens, single column on mobile.
 * Left: section nav + publish panel.
 * Right: active section editor.
 */

import React, { useState } from "react";
import { Link, useParams } from "wouter";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Globe,
  Shield,
  ShieldCheck,
  Link2,
  FileDown,
  Send,
  CheckCircle2,
  Clock,
  ChevronRight,
  Edit3,
  BarChart2,
  Copy,
  ExternalLink,
  AlertTriangle,
  Users,
  Video,
  Trophy,
  BookOpen,
  Ruler,
  FileText,
  Phone,
  TrendingUp,
  Star,
  Swords,
} from "lucide-react";
import { toast } from "sonner";
import {
  DOSSIERS,
  getDossierByPlayerId,
  getViewEventsForDossier,
  DOSSIER_SECTION_LABEL,
  DOSSIER_SECTION_DESCRIPTION,
  VISIBILITY_LABEL,
  VISIBILITY_DESCRIPTION,
  REVIEW_STATE_LABEL,
  type PlayerDossier,
  type DossierSectionKey,
  type SectionVisibility,
  type DossierReviewState,
} from "@/lib/mock/dossier";

/* ─── Colour tokens ──────────────────────────────────────────────────────────── */

const PRIMARY  = "oklch(0.72 0.18 290)";
const SUCCESS  = "oklch(0.75 0.12 140)";
const WARNING  = "oklch(0.78 0.16 75)";
const DANGER   = "oklch(0.68 0.22 25)";
const MUTED    = "oklch(0.55 0.02 260)";

/* ─── Visibility badge ───────────────────────────────────────────────────────── */

const VISIBILITY_COLOR: Record<SectionVisibility, string> = {
  public:     SUCCESS,
  private:    DANGER,
  on_request: WARNING,
};

const VISIBILITY_ICON: Record<SectionVisibility, React.ReactElement> = {
  public:     <Globe className="w-3 h-3" />,
  private:    <Lock className="w-3 h-3" />,
  on_request: <Eye className="w-3 h-3" />,
};

function VisibilityBadge({ v }: { v: SectionVisibility }): React.ReactElement {
  const color = VISIBILITY_COLOR[v];
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
      style={{ background: `${color}20`, color }}
    >
      {VISIBILITY_ICON[v]}
      {VISIBILITY_LABEL[v]}
    </span>
  );
}

/* ─── Verified badge ─────────────────────────────────────────────────────────── */

function VerifiedBadge(): React.ReactElement {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
      style={{ background: `${PRIMARY}20`, color: PRIMARY }}
    >
      <ShieldCheck className="w-3 h-3" />
      HoopsOS verified
    </span>
  );
}

/* ─── Section icon map ───────────────────────────────────────────────────────── */

const SECTION_ICON: Record<DossierSectionKey, React.ReactElement> = {
  bio:                  <FileText className="w-4 h-4" />,
  measurables:          <Ruler className="w-4 h-4" />,
  academics:            <BookOpen className="w-4 h-4" />,
  teams:                <Swords className="w-4 h-4" />,
  clips:                <Video className="w-4 h-4" />,
  stats:                <BarChart2 className="w-4 h-4" />,
  coach_summary:        <Star className="w-4 h-4" />,
  development_progress: <TrendingUp className="w-4 h-4" />,
  contact_rules:        <Phone className="w-4 h-4" />,
};

/* ─── Visibility selector ────────────────────────────────────────────────────── */

function VisibilitySelector({
  value,
  onChange,
  disabled,
}: {
  value: SectionVisibility;
  onChange: (v: SectionVisibility) => void;
  disabled?: boolean;
}): React.ReactElement {
  const options: SectionVisibility[] = ["public", "on_request", "private"];
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => {
        const active  = value === opt;
        const color   = VISIBILITY_COLOR[opt];
        return (
          <button
            key={opt}
            disabled={disabled}
            onClick={() => !disabled && onChange(opt)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-all"
            style={{
              borderColor: active ? color : "oklch(0.28 0.015 260)",
              background:  active ? `${color}15` : "oklch(0.16 0.015 260)",
              color:       active ? color : MUTED,
              opacity:     disabled ? 0.5 : 1,
              cursor:      disabled ? "not-allowed" : "pointer",
            }}
          >
            {VISIBILITY_ICON[opt]}
            {VISIBILITY_LABEL[opt]}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Section content renderers ──────────────────────────────────────────────── */

function SectionBio({ dossier }: { dossier: PlayerDossier }): React.ReactElement {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[11.5px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>Headline</label>
        <div
          className="px-3 py-2.5 rounded-lg border text-[13.5px] font-medium"
          style={{ background: "oklch(0.14 0.01 260)", borderColor: "oklch(0.26 0.015 260)", color: "oklch(0.88 0.01 260)" }}
        >
          {dossier.bio.headline}
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-[11.5px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>Summary</label>
        <div
          className="px-3 py-3 rounded-lg border text-[13px] leading-relaxed"
          style={{ background: "oklch(0.14 0.01 260)", borderColor: "oklch(0.26 0.015 260)", color: "oklch(0.82 0.01 260)" }}
        >
          {dossier.bio.summary}
        </div>
      </div>
      <div className="flex items-center gap-4 text-[12px]" style={{ color: MUTED }}>
        <span>{dossier.bio.hometown}, {dossier.bio.state}</span>
        {dossier.bio.pronouns && <span>{dossier.bio.pronouns}</span>}
      </div>
    </div>
  );
}

function SectionMeasurables({ dossier }: { dossier: PlayerDossier }): React.ReactElement {
  const m = dossier.measurables;
  const rows = [
    { label: "Height",          value: m.height },
    { label: "Weight",          value: m.weight },
    { label: "Wingspan",        value: m.wingspan ?? "—" },
    { label: "Standing reach",  value: m.standingReach ?? "—" },
    { label: "Vertical leap",   value: m.verticalLeap ?? "—" },
    { label: "Lane agility",    value: m.laneAgilitySeconds != null ? `${m.laneAgilitySeconds}s` : "—" },
    { label: "3/4 sprint",      value: m.threeQuarterSprintSeconds != null ? `${m.threeQuarterSprintSeconds}s` : "—" },
  ];
  return (
    <div className="space-y-3">
      {m.verified && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: `${PRIMARY}10` }}>
          <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
          <span className="text-[12px]" style={{ color: PRIMARY }}>
            Verified by {m.verifiedBy} on {m.verifiedDate}
          </span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {rows.map((r) => (
          <div key={r.label} className="rounded-lg border px-3 py-2.5" style={{ borderColor: "oklch(0.26 0.015 260)", background: "oklch(0.14 0.01 260)" }}>
            <div className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>{r.label}</div>
            <div className="text-[14px] font-bold mt-0.5" style={{ color: "oklch(0.93 0.01 260)" }}>{r.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionAcademics({ dossier }: { dossier: PlayerDossier }): React.ReactElement {
  const a = dossier.academics;
  return (
    <div className="space-y-3">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg border"
        style={{ borderColor: `${WARNING}40`, background: `${WARNING}10` }}
      >
        <Lock className="w-3.5 h-3.5" style={{ color: WARNING }} />
        <span className="text-[12px]" style={{ color: WARNING }}>
          This section is private — not shown on public profile
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {a.gpa && <div className="rounded-lg border px-3 py-2.5" style={{ borderColor: "oklch(0.26 0.015 260)", background: "oklch(0.14 0.01 260)" }}>
          <div className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>GPA</div>
          <div className="text-[14px] font-bold mt-0.5" style={{ color: "oklch(0.93 0.01 260)" }}>{a.gpa}</div>
        </div>}
        {a.weightedGpa && <div className="rounded-lg border px-3 py-2.5" style={{ borderColor: "oklch(0.26 0.015 260)", background: "oklch(0.14 0.01 260)" }}>
          <div className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>Weighted GPA</div>
          <div className="text-[14px] font-bold mt-0.5" style={{ color: "oklch(0.93 0.01 260)" }}>{a.weightedGpa}</div>
        </div>}
        {a.satScore && <div className="rounded-lg border px-3 py-2.5" style={{ borderColor: "oklch(0.26 0.015 260)", background: "oklch(0.14 0.01 260)" }}>
          <div className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>SAT</div>
          <div className="text-[14px] font-bold mt-0.5" style={{ color: "oklch(0.93 0.01 260)" }}>{a.satScore}</div>
        </div>}
        {a.intendedMajor && <div className="rounded-lg border px-3 py-2.5" style={{ borderColor: "oklch(0.26 0.015 260)", background: "oklch(0.14 0.01 260)" }}>
          <div className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>Intended major</div>
          <div className="text-[13px] font-semibold mt-0.5" style={{ color: "oklch(0.93 0.01 260)" }}>{a.intendedMajor}</div>
        </div>}
      </div>
      {a.academicHonors && a.academicHonors.length > 0 && (
        <div className="space-y-1">
          <div className="text-[11.5px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>Honors</div>
          {a.academicHonors.map((h) => (
            <div key={h} className="flex items-center gap-2 text-[12.5px]" style={{ color: "oklch(0.82 0.01 260)" }}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: SUCCESS }} />
              {h}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionTeams({ dossier }: { dossier: PlayerDossier }): React.ReactElement {
  return (
    <div className="space-y-3">
      {dossier.teams.map((t) => (
        <div key={t.id} className="rounded-xl border p-4" style={{ borderColor: "oklch(0.26 0.015 260)", background: "oklch(0.14 0.01 260)" }}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[14px] font-bold" style={{ color: "oklch(0.93 0.01 260)" }}>{t.teamName}</div>
              <div className="text-[12px] mt-0.5" style={{ color: MUTED }}>{t.level} · {t.season}</div>
            </div>
            {t.verified && <VerifiedBadge />}
          </div>
          <div className="flex items-center gap-4 mt-3 text-[12.5px]" style={{ color: "oklch(0.80 0.01 260)" }}>
            <span>Role: <strong>{t.role}</strong></span>
            {t.record && <span>Record: <strong>{t.record}</strong></span>}
            <span>Coach: <strong>{t.coachName}</strong></span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionClips({ dossier }: { dossier: PlayerDossier }): React.ReactElement {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <VerifiedBadge />
        <span className="text-[12px]" style={{ color: MUTED }}>
          {dossier.clips.length} coach-selected clip{dossier.clips.length !== 1 ? "s" : ""}
        </span>
      </div>
      {dossier.clips.map((c) => (
        <div key={c.clipId} className="rounded-xl border overflow-hidden" style={{ borderColor: "oklch(0.26 0.015 260)" }}>
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ background: "oklch(0.15 0.015 260)" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: c.highlightType === "positive" ? `${SUCCESS}20` : `${WARNING}20`,
                color:      c.highlightType === "positive" ? SUCCESS : WARNING,
              }}
            >
              <Video className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate" style={{ color: "oklch(0.90 0.01 260)" }}>
                {c.title}
              </div>
              <div className="text-[11px]" style={{ color: MUTED }}>
                {c.category} · {c.startTime}–{c.endTime}
              </div>
            </div>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
              style={{
                background: c.highlightType === "positive" ? `${SUCCESS}20` : `${WARNING}20`,
                color:      c.highlightType === "positive" ? SUCCESS : WARNING,
              }}
            >
              {c.highlightType === "positive" ? "Highlight" : "Development"}
            </span>
          </div>
          <div className="px-4 py-3" style={{ background: "oklch(0.13 0.01 260)" }}>
            <p className="text-[12.5px] leading-relaxed italic" style={{ color: "oklch(0.72 0.01 260)" }}>
              "{c.coachNote}"
            </p>
            <div className="mt-2 text-[11px]" style={{ color: MUTED }}>
              — {dossier.coachName} · Added {new Date(c.addedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionStats({ dossier }: { dossier: PlayerDossier }): React.ReactElement {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {dossier.stats.map((s) => (
          <div key={s.label} className="rounded-xl border p-3 text-center" style={{ borderColor: "oklch(0.26 0.015 260)", background: "oklch(0.14 0.01 260)" }}>
            <div className="text-[22px] font-black" style={{ color: "oklch(0.93 0.01 260)" }}>{s.value}</div>
            <div className="text-[11px] font-semibold mt-0.5" style={{ color: MUTED }}>{s.label}</div>
            {s.verified && <div className="mt-1.5 flex justify-center"><ShieldCheck className="w-3 h-3" style={{ color: PRIMARY }} /></div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionCoachSummary({ dossier }: { dossier: PlayerDossier }): React.ReactElement {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <VerifiedBadge />
        <span className="text-[12px]" style={{ color: MUTED }}>Written by {dossier.coachName}</span>
      </div>
      <div
        className="rounded-xl border px-4 py-4"
        style={{ background: "oklch(0.14 0.01 260)", borderColor: "oklch(0.26 0.015 260)" }}
      >
        {dossier.coachSummary ? (
          <p className="text-[13.5px] leading-relaxed" style={{ color: "oklch(0.85 0.01 260)" }}>
            {dossier.coachSummary}
          </p>
        ) : (
          <p className="text-[13px] italic" style={{ color: MUTED }}>No coach summary written yet.</p>
        )}
      </div>
    </div>
  );
}

function SectionDevelopmentProgress({ dossier }: { dossier: PlayerDossier }): React.ReactElement {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <VerifiedBadge />
        <span className="text-[12px]" style={{ color: MUTED }}>
          {dossier.milestones.length} verified milestone{dossier.milestones.length !== 1 ? "s" : ""}
        </span>
      </div>
      {dossier.milestones.length === 0 && (
        <div className="text-[13px] italic text-center py-8" style={{ color: MUTED }}>
          No milestones added yet.
        </div>
      )}
      {dossier.milestones.map((m) => (
        <div key={m.milestoneId} className="rounded-xl border p-4" style={{ borderColor: "oklch(0.26 0.015 260)", background: "oklch(0.14 0.01 260)" }}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${PRIMARY}20` }}
              >
                <Trophy className="w-3.5 h-3.5" style={{ color: PRIMARY }} />
              </div>
              <div>
                <div className="text-[13px] font-bold" style={{ color: "oklch(0.92 0.01 260)" }}>{m.title}</div>
                <div className="text-[11px]" style={{ color: MUTED }}>
                  Earned {m.earnedDate} · Verified by {m.verifier}
                </div>
              </div>
            </div>
            {m.verified && <VerifiedBadge />}
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: "oklch(0.78 0.01 260)" }}>
            {m.description}
          </p>
        </div>
      ))}
    </div>
  );
}

function SectionContactRules({ dossier }: { dossier: PlayerDossier }): React.ReactElement {
  const c = dossier.contactRules;
  return (
    <div className="space-y-3">
      <div className="rounded-xl border px-4 py-4" style={{ borderColor: "oklch(0.26 0.015 260)", background: "oklch(0.14 0.01 260)" }}>
        <div className="space-y-2 text-[13px]">
          <div className="flex items-center justify-between">
            <span style={{ color: MUTED }}>Primary contact</span>
            <span className="font-semibold" style={{ color: "oklch(0.88 0.01 260)" }}>{c.contactName}</span>
          </div>
          {c.contactEmail && (
            <div className="flex items-center justify-between">
              <span style={{ color: MUTED }}>Email</span>
              <span className="font-semibold" style={{ color: "oklch(0.88 0.01 260)" }}>{c.contactEmail}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span style={{ color: MUTED }}>Preferred channel</span>
            <span className="font-semibold capitalize" style={{ color: "oklch(0.88 0.01 260)" }}>{c.preferredChannel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: MUTED }}>Direct message</span>
            <span className="font-semibold" style={{ color: c.allowDirectMessage ? SUCCESS : DANGER }}>
              {c.allowDirectMessage ? "Allowed" : "Not allowed"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: MUTED }}>Family approval required</span>
            <span className="font-semibold" style={{ color: c.requireFamilyApproval ? WARNING : MUTED }}>
              {c.requireFamilyApproval ? "Yes" : "No"}
            </span>
          </div>
        </div>
        {c.note && (
          <div
            className="mt-3 px-3 py-2 rounded-lg border text-[12px] italic"
            style={{ borderColor: "oklch(0.24 0.015 260)", background: "oklch(0.12 0.01 260)", color: MUTED }}
          >
            {c.note}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Review state banner ────────────────────────────────────────────────────── */

function ReviewBanner({
  state,
  onAction,
}: {
  state: DossierReviewState;
  onAction: (next: DossierReviewState) => void;
}): React.ReactElement | null {
  if (state === "published") return null;

  const config: Record<
    Exclude<DossierReviewState, "published">,
    { color: string; message: string; action?: string; next?: DossierReviewState }
  > = {
    draft:                 { color: MUTED,   message: "This dossier is a draft — not visible publicly.", action: "Send for player review", next: "pending_player_review" },
    pending_player_review: { color: WARNING, message: "Awaiting player review and approval." },
    pending_parent_review: { color: WARNING, message: "Awaiting parent/guardian review and approval." },
    approved:              { color: SUCCESS, message: "Approved by player and family. Ready to publish.", action: "Publish dossier", next: "published" },
  };

  const c = config[state];
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border"
      style={{ borderColor: `${c.color}30`, background: `${c.color}10` }}
    >
      <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: c.color }} />
      <span className="flex-1 text-[12.5px]" style={{ color: c.color }}>
        {c.message}
      </span>
      {c.action && c.next && (
        <button
          onClick={() => onAction(c.next!)}
          className="text-[12px] font-bold px-2.5 py-1 rounded-lg shrink-0 transition-opacity hover:opacity-80"
          style={{ background: `${c.color}20`, color: c.color }}
        >
          {c.action}
        </button>
      )}
    </div>
  );
}

/* ─── Analytics panel ────────────────────────────────────────────────────────── */

function AnalyticsPanel({ dossier }: { dossier: PlayerDossier }): React.ReactElement {
  const events = getViewEventsForDossier(dossier.id);
  const schools = Array.from(new Set(events.map((e) => e.viewerSchool).filter(Boolean)));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total views",   value: String(events.length) },
          { label: "Schools",       value: String(schools.length) },
          { label: "Avg. duration", value: events.length > 0 ? `${Math.round(events.reduce((s, e) => s + e.durationSeconds, 0) / events.length)}s` : "—" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-3 text-center" style={{ borderColor: "oklch(0.26 0.015 260)", background: "oklch(0.14 0.01 260)" }}>
            <div className="text-[20px] font-black" style={{ color: "oklch(0.93 0.01 260)" }}>{s.value}</div>
            <div className="text-[10.5px] font-semibold mt-0.5" style={{ color: MUTED }}>{s.label}</div>
          </div>
        ))}
      </div>
      {events.length > 0 && (
        <div className="space-y-2">
          {events.slice(0, 5).map((e) => (
            <div key={e.id} className="flex items-center gap-3 py-1.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ background: `${PRIMARY}20`, color: PRIMARY }}
              >
                {e.viewerName ? e.viewerName.split(" ").map((n) => n[0]).slice(0, 2).join("") : "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-semibold truncate" style={{ color: "oklch(0.85 0.01 260)" }}>
                  {e.viewerName ?? "Anonymous"}{e.viewerTitle ? ` · ${e.viewerTitle}` : ""}
                </div>
                <div className="text-[11px]" style={{ color: MUTED }}>
                  {e.viewerSchool ?? e.viewerType} · {new Date(e.viewedAt).toLocaleDateString()}
                </div>
              </div>
              {e.viewerDivision && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: `${PRIMARY}20`, color: PRIMARY }}>
                  {e.viewerDivision}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────────── */

export default function DossierBuilderPage(): React.ReactElement {
  const params   = useParams<{ playerId: string }>();
  const playerId = params.playerId ?? "a_1";

  // Mutable local state seeded from mock
  const initial = getDossierByPlayerId(playerId) ?? DOSSIERS[0];
  const [dossier, setDossier] = useState<PlayerDossier>(initial);
  const [activeSection, setActiveSection] = useState<DossierSectionKey>("bio");
  const [reviewState, setReviewState] = useState<DossierReviewState>(dossier.reviewState);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const publicUrl = `${window.location.origin}/p/${dossier.publicSlug}`;
  const privateUrl = `${window.location.origin}/p/${dossier.publicSlug}?preview=1`;

  function updateVisibility(key: DossierSectionKey, v: SectionVisibility): void {
    setDossier((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.key === key ? { ...s, visibility: v } : s,
      ),
    }));
    toast.success(`"${DOSSIER_SECTION_LABEL[key]}" set to ${VISIBILITY_LABEL[v]}`);
  }

  function copyLink(url: string, label: string): void {
    navigator.clipboard.writeText(url).then(() => toast.success(`${label} copied to clipboard`));
  }

  function handleReviewTransition(next: DossierReviewState): void {
    setReviewState(next);
    setDossier((prev) => ({ ...prev, reviewState: next }));
    toast.success(`Status updated: ${REVIEW_STATE_LABEL[next]}`);
  }

  const activeSection_ = dossier.sections.find((s) => s.key === activeSection)!;

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.12 0.01 260)", color: "oklch(0.93 0.01 260)" }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 border-b"
        style={{ background: "oklch(0.14 0.01 260)", borderColor: "oklch(0.22 0.01 260)" }}
      >
        <div className="flex items-center gap-3">
          <Link href={`/app/coach/players/${playerId}`}>
            <a className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-4 h-4" style={{ color: MUTED }} />
            </a>
          </Link>
          <div>
            <h1 className="text-[15px] font-semibold">{dossier.playerName} — Recruiting Dossier</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[10.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
                style={{ background: reviewState === "published" ? `${SUCCESS}20` : `${WARNING}20`, color: reviewState === "published" ? SUCCESS : WARNING }}
              >
                {REVIEW_STATE_LABEL[reviewState]}
              </span>
              <span className="text-[11px]" style={{ color: MUTED }}>
                Last updated {new Date(dossier.lastUpdatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAnalytics((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-semibold transition-all"
            style={{ borderColor: showAnalytics ? PRIMARY : "oklch(0.28 0.015 260)", background: showAnalytics ? `${PRIMARY}15` : "transparent", color: showAnalytics ? PRIMARY : MUTED }}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Analytics</span>
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-semibold"
            style={{ borderColor: "oklch(0.28 0.015 260)", color: MUTED }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </a>
          <button
            onClick={() => {
              toast.info("PDF export would open print dialog — placeholder");
              window.print();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-semibold"
            style={{ borderColor: "oklch(0.28 0.015 260)", color: MUTED }}
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      <div className="flex min-h-0">
        {/* ── Left sidebar ────────────────────────────────────────────────── */}
        <aside
          className="hidden lg:flex flex-col w-64 shrink-0 border-r min-h-screen"
          style={{ background: "oklch(0.13 0.01 260)", borderColor: "oklch(0.20 0.01 260)" }}
        >
          {/* Player identity */}
          <div className="px-4 py-4 border-b" style={{ borderColor: "oklch(0.20 0.01 260)" }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-black shrink-0"
                style={{ background: `${PRIMARY}25`, color: PRIMARY }}
              >
                {dossier.playerInitials}
              </div>
              <div>
                <div className="text-[13.5px] font-bold">{dossier.playerName}</div>
                <div className="text-[11px]" style={{ color: MUTED }}>
                  {dossier.position} · Class of {dossier.gradYear}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" style={{ color: MUTED }} />
              <span className="text-[11.5px]" style={{ color: MUTED }}>
                {dossier.viewCount} view{dossier.viewCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Section nav */}
          <nav className="flex-1 py-2 overflow-y-auto">
            {dossier.sections.map((s) => {
              const active = activeSection === s.key;
              const vColor = VISIBILITY_COLOR[s.visibility];
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{ background: active ? `${PRIMARY}12` : "transparent" }}
                >
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: active ? `${PRIMARY}25` : "oklch(0.20 0.01 260)", color: active ? PRIMARY : MUTED }}
                  >
                    {React.cloneElement(
                      SECTION_ICON[s.key] as React.ReactElement<{ className?: string }>,
                      { className: "w-3 h-3" },
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[12.5px] font-semibold truncate"
                      style={{ color: active ? "oklch(0.93 0.01 260)" : "oklch(0.72 0.01 260)" }}
                    >
                      {DOSSIER_SECTION_LABEL[s.key]}
                    </div>
                  </div>
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: s.hasContent ? vColor : "oklch(0.30 0.01 260)" }}
                  />
                </button>
              );
            })}
          </nav>

          {/* Share links */}
          <div className="px-4 py-4 border-t space-y-2" style={{ borderColor: "oklch(0.20 0.01 260)" }}>
            <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: MUTED }}>
              Share links
            </div>
            <button
              onClick={() => copyLink(publicUrl, "Public link")}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px] font-semibold"
              style={{ borderColor: "oklch(0.26 0.015 260)", background: "oklch(0.16 0.015 260)", color: "oklch(0.80 0.01 260)" }}
            >
              <Globe className="w-3.5 h-3.5 shrink-0" style={{ color: SUCCESS }} />
              <span className="flex-1 truncate text-left">{dossier.publicSlug}</span>
              <Copy className="w-3 h-3 shrink-0" style={{ color: MUTED }} />
            </button>
            <button
              onClick={() => copyLink(privateUrl, "Private preview link")}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px] font-semibold"
              style={{ borderColor: "oklch(0.26 0.015 260)", background: "oklch(0.16 0.015 260)", color: "oklch(0.80 0.01 260)" }}
            >
              <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: WARNING }} />
              <span className="flex-1 text-left">Private preview</span>
              <Copy className="w-3 h-3 shrink-0" style={{ color: MUTED }} />
            </button>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 px-4 lg:px-6 py-5 space-y-5 max-w-3xl">

          {/* Review banner */}
          <ReviewBanner state={reviewState} onAction={handleReviewTransition} />

          {/* Analytics panel */}
          {showAnalytics && (
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: "oklch(0.26 0.015 260)", background: "oklch(0.15 0.015 260)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4" style={{ color: PRIMARY }} />
                <span className="text-[13.5px] font-bold" style={{ color: "oklch(0.90 0.01 260)" }}>
                  View analytics
                </span>
              </div>
              <AnalyticsPanel dossier={dossier} />
            </div>
          )}

          {/* Mobile section selector */}
          <div className="lg:hidden">
            <select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value as DossierSectionKey)}
              className="w-full appearance-none rounded-xl border px-4 py-2.5 text-[13px] font-medium focus:outline-none"
              style={{ background: "oklch(0.16 0.015 260)", borderColor: "oklch(0.28 0.015 260)", color: "oklch(0.88 0.01 260)" }}
            >
              {dossier.sections.map((s) => (
                <option key={s.key} value={s.key}>{DOSSIER_SECTION_LABEL[s.key]}</option>
              ))}
            </select>
          </div>

          {/* Section editor card */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: "oklch(0.24 0.015 260)" }}
          >
            {/* Section header */}
            <div
              className="flex items-center justify-between gap-3 px-5 py-4 border-b"
              style={{ background: "oklch(0.155 0.015 260)", borderColor: "oklch(0.22 0.01 260)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${PRIMARY}20`, color: PRIMARY }}
                >
                  {React.cloneElement(
                    SECTION_ICON[activeSection] as React.ReactElement<{ className?: string }>,
                    { className: "w-4 h-4" },
                  )}
                </div>
                <div>
                  <div className="text-[14px] font-bold" style={{ color: "oklch(0.92 0.01 260)" }}>
                    {DOSSIER_SECTION_LABEL[activeSection]}
                  </div>
                  <div className="text-[11.5px] mt-0.5" style={{ color: MUTED }}>
                    {DOSSIER_SECTION_DESCRIPTION[activeSection]}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {activeSection_.verified && <VerifiedBadge />}
                <VisibilityBadge v={activeSection_.visibility} />
              </div>
            </div>

            {/* Visibility control */}
            <div
              className="flex items-center justify-between gap-3 px-5 py-3 border-b"
              style={{ background: "oklch(0.13 0.01 260)", borderColor: "oklch(0.20 0.01 260)" }}
            >
              <span className="text-[12px] font-semibold" style={{ color: MUTED }}>Visibility</span>
              <VisibilitySelector
                value={activeSection_.visibility}
                onChange={(v) => updateVisibility(activeSection, v)}
                disabled={activeSection_.coachOnly && false /* coach always editable */}
              />
            </div>

            {/* Section body */}
            <div className="px-5 py-5" style={{ background: "oklch(0.12 0.01 260)" }}>
              {activeSection === "bio"                  && <SectionBio dossier={dossier} />}
              {activeSection === "measurables"          && <SectionMeasurables dossier={dossier} />}
              {activeSection === "academics"            && <SectionAcademics dossier={dossier} />}
              {activeSection === "teams"                && <SectionTeams dossier={dossier} />}
              {activeSection === "clips"                && <SectionClips dossier={dossier} />}
              {activeSection === "stats"                && <SectionStats dossier={dossier} />}
              {activeSection === "coach_summary"        && <SectionCoachSummary dossier={dossier} />}
              {activeSection === "development_progress" && <SectionDevelopmentProgress dossier={dossier} />}
              {activeSection === "contact_rules"        && <SectionContactRules dossier={dossier} />}
            </div>
          </div>

          {/* Navigation arrows */}
          <div className="flex items-center justify-between pb-8">
            {(() => {
              const keys = dossier.sections.map((s) => s.key);
              const idx  = keys.indexOf(activeSection);
              const prev = idx > 0 ? keys[idx - 1] : null;
              const next = idx < keys.length - 1 ? keys[idx + 1] : null;
              return (
                <>
                  {prev ? (
                    <button
                      onClick={() => setActiveSection(prev)}
                      className="flex items-center gap-1.5 text-[12.5px] font-semibold"
                      style={{ color: MUTED }}
                    >
                      ← {DOSSIER_SECTION_LABEL[prev]}
                    </button>
                  ) : <div />}
                  {next ? (
                    <button
                      onClick={() => setActiveSection(next)}
                      className="flex items-center gap-1.5 text-[12.5px] font-semibold"
                      style={{ color: PRIMARY }}
                    >
                      {DOSSIER_SECTION_LABEL[next]} →
                    </button>
                  ) : (
                    reviewState !== "published" ? (
                      <button
                        onClick={() => handleReviewTransition("pending_player_review")}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-bold"
                        style={{ background: PRIMARY, color: "#fff" }}
                      >
                        <Send className="w-3.5 h-3.5" />
                        Submit for review
                      </button>
                    ) : (
                      <span className="text-[12px] font-semibold" style={{ color: SUCCESS }}>
                        ✓ Published
                      </span>
                    )
                  )}
                </>
              );
            })()}
          </div>
        </main>
      </div>
    </div>
  );
}
