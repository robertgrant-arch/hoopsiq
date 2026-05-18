/**
 * PublicDossierPage — /p/:slug
 *
 * Standalone public-facing recruiting / showcase dossier.
 * NO auth required. NO AppShell.
 *
 * Acceptance criteria:
 *  ✓ AC1: Clips and verified milestones appear (pulled from dossier.clips / dossier.milestones)
 *  ✓ AC2: Private sections hidden — "academics" is private, not rendered
 *  ✓ AC3: recordViewEvent() called on mount — view logged to VIEW_EVENTS
 *
 * Layout:
 *   1. Minimal top nav (logo + "built with HoopsOS")
 *   2. Player hero + identity
 *   3. Verified data strip
 *   4. Sections (only visibility="public" rendered)
 *   5. Coach CTA (access request form)
 *   6. Footer
 */

import React, { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import {
  ShieldCheck,
  Eye,
  MapPin,
  Video,
  TrendingUp,
  Trophy,
  BarChart2,
  FileText,
  Ruler,
  BookOpen,
  Users,
  Phone,
  Star,
  Globe,
  Lock,
  Send,
  CheckCircle2,
  ExternalLink,
  Swords,
} from "lucide-react";
import { toast } from "sonner";
import {
  getDossierBySlug,
  recordViewEvent,
  isSectionVisible,
  DOSSIER_SECTION_LABEL,
  type PlayerDossier,
  type DossierSectionKey,
  type DossierClip,
  type DossierMilestone,
  type DossierTeam,
  type DossierStat,
} from "@/features/recruiting/dossier";

/* ─── Colour tokens ──────────────────────────────────────────────────────────── */

const PRIMARY  = "oklch(0.72 0.18 290)";
const SUCCESS  = "oklch(0.75 0.12 140)";
const WARNING  = "oklch(0.78 0.16 75)";
const DANGER   = "oklch(0.68 0.22 25)";
const MUTED    = "oklch(0.55 0.02 260)";

const BG_BASE    = "oklch(0.10 0.008 260)";
const BG_SURFACE = "oklch(0.14 0.01 260)";
const BG_CARD    = "oklch(0.16 0.012 260)";
const BORDER     = "oklch(0.22 0.01 260)";
const TEXT_HEAD  = "oklch(0.96 0.005 260)";
const TEXT_BODY  = "oklch(0.82 0.01 260)";

/* ─── Section wrapper ────────────────────────────────────────────────────────── */

function Section({
  id,
  title,
  icon,
  verified,
  children,
}: {
  id: string;
  title: string;
  icon: React.ReactElement;
  verified?: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section id={id} className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${PRIMARY}20` }}
        >
          {React.cloneElement(
            icon as React.ReactElement<{ className?: string; style?: React.CSSProperties }>,
            { className: "w-4 h-4", style: { color: PRIMARY } },
          )}
        </div>
        <h2 className="text-[16px] font-bold" style={{ color: TEXT_HEAD }}>
          {title}
        </h2>
        {verified && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
            style={{ background: `${PRIMARY}20`, color: PRIMARY }}
          >
            <ShieldCheck className="w-3 h-3" />
            HoopsOS verified
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

/* ─── Verified strip item ────────────────────────────────────────────────────── */

function VerifiedPill({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{ background: `${PRIMARY}15`, border: `1px solid ${PRIMARY}30` }}
    >
      <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: PRIMARY }} />
      <span className="text-[12px]" style={{ color: TEXT_BODY }}>
        <span className="font-semibold" style={{ color: TEXT_HEAD }}>{value}</span>
        {" "}{label}
      </span>
    </div>
  );
}

/* ─── Clip card ──────────────────────────────────────────────────────────────── */

function ClipCard({ clip, coachName }: { clip: DossierClip; coachName: string }): React.ReactElement {
  const isPositive = clip.highlightType === "positive";
  const accent = isPositive ? SUCCESS : WARNING;
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
      {/* Video thumbnail mock */}
      <div
        className="relative flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, oklch(0.12 0.01 260), oklch(0.18 0.02 290))`,
          height: 140,
        }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: `${accent}25`, border: `2px solid ${accent}50` }}
        >
          <Video className="w-5 h-5" style={{ color: accent }} />
        </div>
        <div
          className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold"
          style={{ background: `${accent}20`, color: accent }}
        >
          <ShieldCheck className="w-3 h-3" />
          Verified clip
        </div>
        <div
          className="absolute bottom-3 right-3 px-2 py-1 rounded-lg text-[10px] font-bold"
          style={{ background: "oklch(0.10 0.01 260 / 0.8)", color: MUTED }}
        >
          {clip.startTime}–{clip.endTime}
        </div>
        <div
          className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold"
          style={{ background: `${accent}20`, color: accent }}
        >
          {isPositive ? "Highlight" : "Development"}
        </div>
      </div>

      {/* Clip info */}
      <div className="px-4 py-3" style={{ background: BG_CARD }}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-[13.5px] font-bold leading-tight" style={{ color: TEXT_HEAD }}>
              {clip.title}
            </h4>
            <p className="text-[11.5px] mt-0.5" style={{ color: MUTED }}>
              {clip.category}
            </p>
          </div>
        </div>
        {clip.coachNote && (
          <div className="mt-3 border-t pt-3" style={{ borderColor: BORDER }}>
            <p className="text-[12.5px] leading-relaxed italic" style={{ color: "oklch(0.68 0.01 260)" }}>
              "{clip.coachNote}"
            </p>
            <p className="mt-1.5 text-[11px]" style={{ color: MUTED }}>
              — {coachName}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Milestone card ─────────────────────────────────────────────────────────── */

function MilestoneCard({ m }: { m: DossierMilestone }): React.ReactElement {
  const catColor =
    m.category === "performance"  ? SUCCESS :
    m.category === "development"  ? PRIMARY :
    m.category === "leadership"   ? WARNING :
    MUTED;

  return (
    <div
      className="flex items-start gap-4 rounded-2xl p-4"
      style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${catColor}20` }}
      >
        <Trophy className="w-4.5 h-4.5" style={{ color: catColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-[13.5px] font-bold" style={{ color: TEXT_HEAD }}>{m.title}</h4>
          {m.verified && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
              style={{ background: `${PRIMARY}20`, color: PRIMARY }}
            >
              <ShieldCheck className="w-2.5 h-2.5" />
              Verified
            </span>
          )}
        </div>
        <p className="text-[12.5px] mt-1 leading-relaxed" style={{ color: TEXT_BODY }}>
          {m.description}
        </p>
        <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: MUTED }}>
          <span>Earned {m.earnedDate}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            {m.verifier}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Access request form ────────────────────────────────────────────────────── */

function AccessRequestForm({ dossier }: { dossier: PlayerDossier }): React.ReactElement {
  const [name, setName]     = useState("");
  const [title, setTitle]   = useState("");
  const [school, setSchool] = useState("");
  const [div, setDiv]       = useState("");
  const [msg, setMsg]       = useState("");
  const [sent, setSent]     = useState(false);

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (!name || !school) return;
    setSent(true);
    toast.success("Access request submitted — family will be notified");
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: `${SUCCESS}20` }}
        >
          <CheckCircle2 className="w-6 h-6" style={{ color: SUCCESS }} />
        </div>
        <p className="text-[14px] font-semibold" style={{ color: TEXT_HEAD }}>Request submitted!</p>
        <p className="text-[13px]" style={{ color: MUTED }}>
          {dossier.contactRules.contactName} will be notified and may reach out within 48 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11.5px] font-semibold mb-1.5" style={{ color: MUTED }}>Your name *</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Coach Jane Smith"
            className="w-full rounded-xl border px-3 py-2.5 text-[13px] focus:outline-none focus:ring-1"
            style={{ background: "oklch(0.13 0.01 260)", borderColor: "oklch(0.26 0.015 260)", color: TEXT_HEAD, caretColor: PRIMARY }}
          />
        </div>
        <div>
          <label className="block text-[11.5px] font-semibold mb-1.5" style={{ color: MUTED }}>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Head Coach / Assistant"
            className="w-full rounded-xl border px-3 py-2.5 text-[13px] focus:outline-none focus:ring-1"
            style={{ background: "oklch(0.13 0.01 260)", borderColor: "oklch(0.26 0.015 260)", color: TEXT_HEAD, caretColor: PRIMARY }}
          />
        </div>
        <div>
          <label className="block text-[11.5px] font-semibold mb-1.5" style={{ color: MUTED }}>Institution *</label>
          <input
            required
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="University name"
            className="w-full rounded-xl border px-3 py-2.5 text-[13px] focus:outline-none focus:ring-1"
            style={{ background: "oklch(0.13 0.01 260)", borderColor: "oklch(0.26 0.015 260)", color: TEXT_HEAD, caretColor: PRIMARY }}
          />
        </div>
        <div>
          <label className="block text-[11.5px] font-semibold mb-1.5" style={{ color: MUTED }}>Division</label>
          <select
            value={div}
            onChange={(e) => setDiv(e.target.value)}
            className="w-full appearance-none rounded-xl border px-3 py-2.5 text-[13px] focus:outline-none"
            style={{ background: "oklch(0.13 0.01 260)", borderColor: "oklch(0.26 0.015 260)", color: div ? TEXT_HEAD : MUTED }}
          >
            <option value="">Select division</option>
            {["D1", "D2", "D3", "NAIA", "JUCO"].map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-[11.5px] font-semibold mb-1.5" style={{ color: MUTED }}>Message</label>
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          rows={3}
          placeholder="Briefly describe your interest and what you're looking for in a recruit…"
          className="w-full rounded-xl border px-3 py-2.5 text-[13px] resize-none focus:outline-none focus:ring-1"
          style={{ background: "oklch(0.13 0.01 260)", borderColor: "oklch(0.26 0.015 260)", color: TEXT_HEAD, caretColor: PRIMARY }}
        />
      </div>
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-bold transition-opacity hover:opacity-90"
        style={{ background: PRIMARY, color: "#fff" }}
      >
        <Send className="w-4 h-4" />
        Submit access request
      </button>
      {dossier.contactRules.requireFamilyApproval && (
        <p className="text-center text-[11.5px]" style={{ color: MUTED }}>
          All requests require family approval before contact.
        </p>
      )}
    </form>
  );
}

/* ─── Not found ──────────────────────────────────────────────────────────────── */

function NotFoundDossier(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6" style={{ background: BG_BASE }}>
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: `${DANGER}20` }}
      >
        <Globe className="w-7 h-7" style={{ color: DANGER }} />
      </div>
      <h1 className="text-[20px] font-black" style={{ color: TEXT_HEAD }}>Profile not found</h1>
      <p className="text-[14px] text-center" style={{ color: MUTED }}>
        This recruiting profile doesn't exist or may have been unpublished.
      </p>
      <Link href="/" asChild>
        <a className="text-[13px] font-semibold" style={{ color: PRIMARY }}>← Back to HoopsOS</a>
      </Link>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────────── */

export default function PublicDossierPage(): React.ReactElement {
  const params = useParams<{ slug: string }>();
  const slug   = params.slug ?? "";

  const dossier = getDossierBySlug(slug);

  /* ── AC #3: Record view event on mount ──────────────────────────────────── */
  const [viewRecorded, setViewRecorded] = useState(false);
  useEffect(() => {
    if (!dossier || viewRecorded) return;
    recordViewEvent(dossier.id, dossier.publicSlug, "college_coach", {
      sectionsViewed: ["bio"],
      durationSeconds: 0,
      referrer: document.referrer || "direct",
    });
    setViewRecorded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossier?.id]);

  if (!dossier) return <NotFoundDossier />;

  /* Helpers for visibility checks */
  const show = (key: DossierSectionKey): boolean =>
    isSectionVisible(dossier, key, true); // publicView = true

  const sectionMeta = (key: DossierSectionKey) =>
    dossier.sections.find((s) => s.key === key)!;

  /* Verified counts for strip */
  const verifiedClips      = dossier.clips.filter((c) => c.verified).length;
  const verifiedMilestones = dossier.milestones.filter((m) => m.verified).length;

  return (
    <div className="min-h-screen" style={{ background: BG_BASE, color: TEXT_BODY }}>

      {/* ── Top nav ─────────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-8 py-3 border-b"
        style={{ background: "oklch(0.12 0.008 260 / 0.95)", borderColor: "oklch(0.20 0.01 260)", backdropFilter: "blur(8px)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: PRIMARY }}
          >
            <span className="text-[11px] font-black text-white">H</span>
          </div>
          <span className="text-[13px] font-bold" style={{ color: TEXT_HEAD }}>HoopsOS</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-[11.5px]" style={{ color: MUTED }}>
            Recruiting profile
          </span>
          <Link href="/sign-in" asChild>
            <a
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-colors"
              style={{ borderColor: "oklch(0.28 0.015 260)", color: "oklch(0.80 0.01 260)" }}
            >
              Coach sign in
            </a>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-10">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{ background: `linear-gradient(135deg, oklch(0.14 0.015 280), oklch(0.12 0.01 260))`, border: `1px solid ${BORDER}` }}
        >
          {/* Banner gradient bar */}
          <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${PRIMARY}, oklch(0.68 0.22 200))` }} />

          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-[28px] font-black shrink-0"
                style={{ background: `${PRIMARY}25`, color: PRIMARY }}
              >
                {dossier.playerInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h1 className="text-[26px] sm:text-[30px] font-black leading-tight" style={{ color: TEXT_HEAD }}>
                      {dossier.playerName}
                    </h1>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className="text-[12px] font-bold px-2.5 py-1 rounded-full"
                        style={{ background: `${PRIMARY}20`, color: PRIMARY }}
                      >
                        {dossier.position}
                      </span>
                      <span
                        className="text-[12px] font-bold px-2.5 py-1 rounded-full"
                        style={{ background: "oklch(0.20 0.01 260)", color: MUTED }}
                      >
                        Class of {dossier.gradYear}
                      </span>
                      <span className="text-[12px]" style={{ color: MUTED }}>
                        #{dossier.jerseyNumber}
                      </span>
                    </div>
                  </div>
                  {/* HoopsOS verified badge */}
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0"
                    style={{ background: `${PRIMARY}15`, border: `1px solid ${PRIMARY}30` }}
                  >
                    <ShieldCheck className="w-4 h-4" style={{ color: PRIMARY }} />
                    <span className="text-[11.5px] font-bold" style={{ color: PRIMARY }}>
                      HoopsOS Verified
                    </span>
                  </div>
                </div>

                {/* Bio headline */}
                {show("bio") && (
                  <p className="mt-3 text-[14px] leading-relaxed font-medium" style={{ color: "oklch(0.75 0.01 260)" }}>
                    {dossier.bio.headline}
                  </p>
                )}

                {/* Location */}
                {show("bio") && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <MapPin className="w-3.5 h-3.5" style={{ color: MUTED }} />
                    <span className="text-[12.5px]" style={{ color: MUTED }}>
                      {dossier.bio.hometown}, {dossier.bio.state}
                    </span>
                  </div>
                )}

                {/* Program */}
                <div className="flex items-center gap-1.5 mt-1">
                  <Swords className="w-3.5 h-3.5" style={{ color: MUTED }} />
                  <span className="text-[12.5px]" style={{ color: MUTED }}>
                    {dossier.programName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Verified data strip ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {verifiedClips > 0 && (
            <VerifiedPill value={String(verifiedClips)} label={`coach-selected clip${verifiedClips !== 1 ? "s" : ""}`} />
          )}
          {verifiedMilestones > 0 && (
            <VerifiedPill value={String(verifiedMilestones)} label={`development milestone${verifiedMilestones !== 1 ? "s" : ""}`} />
          )}
          {show("measurables") && dossier.measurables.verified && (
            <VerifiedPill value="Measurables" label="coach-verified" />
          )}
          {show("stats") && dossier.stats.filter((s) => s.verified).length > 0 && (
            <VerifiedPill value={String(dossier.stats.filter((s) => s.verified).length)} label="verified stats" />
          )}
        </div>

        {/* ── Bio summary ───────────────────────────────────────────────────── */}
        {show("bio") && (
          <Section id="bio" title="About" icon={<FileText />}>
            <div
              className="rounded-2xl px-5 py-4"
              style={{ background: BG_SURFACE, border: `1px solid ${BORDER}` }}
            >
              <p className="text-[14px] leading-relaxed" style={{ color: TEXT_BODY }}>
                {dossier.bio.summary}
              </p>
            </div>
          </Section>
        )}

        {/* ── Measurables ───────────────────────────────────────────────────── */}
        {show("measurables") && (
          <Section id="measurables" title="Measurables" icon={<Ruler />} verified={dossier.measurables.verified}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Height",        value: dossier.measurables.height },
                { label: "Weight",        value: dossier.measurables.weight },
                { label: "Wingspan",      value: dossier.measurables.wingspan ?? "N/A" },
                { label: "Vertical",      value: dossier.measurables.verticalLeap ?? "N/A" },
                { label: "Lane agility",  value: dossier.measurables.laneAgilitySeconds != null ? `${dossier.measurables.laneAgilitySeconds}s` : "N/A" },
                { label: "3/4 sprint",    value: dossier.measurables.threeQuarterSprintSeconds != null ? `${dossier.measurables.threeQuarterSprintSeconds}s` : "N/A" },
              ].filter((r) => r.value !== "N/A").map((r) => (
                <div
                  key={r.label}
                  className="rounded-2xl p-4 text-center"
                  style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}
                >
                  <div className="text-[22px] font-black" style={{ color: TEXT_HEAD }}>{r.value}</div>
                  <div className="text-[11px] font-semibold mt-1 uppercase tracking-wide" style={{ color: MUTED }}>{r.label}</div>
                </div>
              ))}
            </div>
            {dossier.measurables.verified && (
              <div className="flex items-center gap-2 text-[12px]" style={{ color: MUTED }}>
                <ShieldCheck className="w-3.5 h-3.5" style={{ color: PRIMARY }} />
                Verified by {dossier.measurables.verifiedBy} on {dossier.measurables.verifiedDate}
              </div>
            )}
          </Section>
        )}

        {/* ── Academics (private — hidden from public) ──────────────────────── */}
        {/* AC #2: academics section is private, so show() returns false — this block never renders */}
        {show("academics") && (
          <Section id="academics" title="Academics" icon={<BookOpen />}>
            <p>Academic info visible here.</p>
          </Section>
        )}

        {/* ── Teams ────────────────────────────────────────────────────────── */}
        {show("teams") && dossier.teams.length > 0 && (
          <Section id="teams" title="Teams & Programs" icon={<Swords />} verified>
            <div className="space-y-3">
              {dossier.teams.map((t: DossierTeam) => (
                <div
                  key={t.id}
                  className="flex items-center gap-4 rounded-2xl p-4"
                  style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-[13px]"
                    style={{ background: `${PRIMARY}20`, color: PRIMARY }}
                  >
                    {t.teamName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold" style={{ color: TEXT_HEAD }}>{t.teamName}</div>
                    <div className="text-[12px]" style={{ color: MUTED }}>{t.level} · {t.season} · {t.role}</div>
                  </div>
                  {t.record && (
                    <div className="text-center shrink-0">
                      <div className="text-[16px] font-black" style={{ color: TEXT_HEAD }}>{t.record}</div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>Record</div>
                    </div>
                  )}
                  {t.verified && <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Stats ─────────────────────────────────────────────────────────── */}
        {show("stats") && dossier.stats.length > 0 && (
          <Section id="stats" title="Stats" icon={<BarChart2 />} verified>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {dossier.stats.map((s: DossierStat) => (
                <div
                  key={s.label}
                  className="rounded-2xl p-4 text-center"
                  style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}
                >
                  <div className="text-[24px] font-black" style={{ color: TEXT_HEAD }}>{s.value}</div>
                  <div className="text-[11px] font-semibold mt-0.5 uppercase tracking-wide" style={{ color: MUTED }}>{s.label}</div>
                  <div className="text-[10px] mt-1" style={{ color: "oklch(0.45 0.01 260)" }}>{s.period}</div>
                  {s.verified && <ShieldCheck className="w-3 h-3 mx-auto mt-1.5" style={{ color: PRIMARY }} />}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Highlight clips (AC #1: 3 clips rendered) ────────────────────── */}
        {show("clips") && dossier.clips.length > 0 && (
          <Section id="clips" title={`Highlight Clips (${dossier.clips.length})`} icon={<Video />} verified>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dossier.clips.map((c: DossierClip) => (
                <ClipCard key={c.clipId} clip={c} coachName={dossier.coachName} />
              ))}
            </div>
          </Section>
        )}

        {/* ── Development progress (AC #1: 2 verified milestones rendered) ──── */}
        {show("development_progress") && dossier.milestones.length > 0 && (
          <Section id="development_progress" title="Development Progress" icon={<TrendingUp />} verified>
            <div className="space-y-3">
              {dossier.milestones.map((m: DossierMilestone) => (
                <MilestoneCard key={m.milestoneId} m={m} />
              ))}
            </div>
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: `${PRIMARY}10`, border: `1px solid ${PRIMARY}25` }}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
              <p className="text-[12.5px]" style={{ color: TEXT_BODY }}>
                All milestones are verified by coaches through the HoopsOS platform. Improvement data is sourced from tracked practice sessions, film review, and coach assessments.
              </p>
            </div>
          </Section>
        )}

        {/* ── Coach summary (on_request — hidden unless explicitly public) ──── */}
        {show("coach_summary") && dossier.coachSummary && (
          <Section id="coach_summary" title="Coach Summary" icon={<Star />} verified>
            <div
              className="rounded-2xl px-6 py-5"
              style={{ background: BG_SURFACE, border: `1px solid ${BORDER}` }}
            >
              <div
                className="w-8 h-1 rounded-full mb-4"
                style={{ background: PRIMARY }}
              />
              <p className="text-[14.5px] leading-relaxed" style={{ color: TEXT_BODY }}>
                {dossier.coachSummary}
              </p>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: BORDER }}>
                <ShieldCheck className="w-4 h-4" style={{ color: PRIMARY }} />
                <span className="text-[12px] font-semibold" style={{ color: PRIMARY }}>
                  {dossier.coachName} · {dossier.programName}
                </span>
              </div>
            </div>
          </Section>
        )}

        {/* ── Contact / Access request CTA ─────────────────────────────────── */}
        {show("contact_rules") && (
          <section id="contact">
            <div
              className="rounded-3xl overflow-hidden"
              style={{ background: `linear-gradient(135deg, oklch(0.15 0.018 290), oklch(0.13 0.012 260))`, border: `1px solid ${BORDER}` }}
            >
              <div className="h-1" style={{ background: `linear-gradient(90deg, ${PRIMARY}, oklch(0.68 0.22 200))` }} />
              <div className="px-6 py-8">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5" style={{ color: PRIMARY }} />
                  <h2 className="text-[18px] font-bold" style={{ color: TEXT_HEAD }}>
                    Request full access
                  </h2>
                </div>
                <p className="text-[13.5px] mb-6" style={{ color: MUTED }}>
                  Submit a recruiting access request to view the full dossier and connect with {dossier.playerName}'s family.
                </p>
                <AccessRequestForm dossier={dossier} />
              </div>
            </div>
          </section>
        )}

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer className="py-8 border-t" style={{ borderColor: "oklch(0.18 0.01 260)" }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: PRIMARY }}>
                <span className="text-[10px] font-black text-white">H</span>
              </div>
              <span className="text-[12px] font-semibold" style={{ color: "oklch(0.70 0.01 260)" }}>
                HoopsOS — Built on verified development data
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11.5px]" style={{ color: MUTED }}>
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: PRIMARY }} />
              All verified data sourced from HoopsOS platform activity
            </div>
          </div>
          <p className="mt-3 text-[11px]" style={{ color: "oklch(0.40 0.01 260)" }}>
            This profile was published by {dossier.coachName} on behalf of {dossier.playerName}. Contact rules and visibility settings are managed by the program.
          </p>
        </footer>
      </div>

      {/* Print stylesheet placeholder */}
      <style>{`
        @media print {
          nav, footer { display: none !important; }
          body { background: white !important; color: black !important; }
          [style*="oklch"] { color: black !important; background: white !important; }
        }
      `}</style>
    </div>
  );
}
