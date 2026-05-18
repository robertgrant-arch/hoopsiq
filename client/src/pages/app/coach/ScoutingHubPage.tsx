import { useState } from "react";
import { Link } from "wouter";
import {
  Search, Plus, ChevronRight, Film, BookOpen,
  Calendar, Trophy, Target, Clock, CheckCircle2,
  AlertTriangle, FileText, Crosshair,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  mockOpponents, mockScoutReports, mockUpcomingGames,
  teamColor, statusMeta, type Opponent, type ScoutReportStatus,
} from "@/lib/mock/scouting";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatGameDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return "Past";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}


// ── Next game hero ─────────────────────────────────────────────────────────

function NextGameHero() {
  const next = mockUpcomingGames[0];
  if (!next) return null;
  const report = mockScoutReports.find((r) => r.id === next.scoutReportId);
  const opp = mockOpponents.find((o) => o.id === next.opponentId);
  const hue = opp?.primaryColor ? Number(opp.primaryColor) : 220;
  const c = teamColor(hue);
  const sm = report ? statusMeta(report.status) : null;
  const days = daysUntil(next.gameDate);
  const hasReport = !!report;

  return (
    <div
      className="rounded-2xl border p-6 relative overflow-hidden"
      style={{ borderColor: c.border, background: c.bg }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Trophy className="w-3 h-3" />
            Next game
          </div>
          <h2 className="text-[26px] font-bold leading-tight" style={{ color: c.text }}>
            vs. {next.opponentName}
          </h2>
          <div className="flex items-center gap-3 mt-1.5 text-[13px] text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatGameDate(next.gameDate)}</span>
            <span className="capitalize">{next.homeAway}</span>
            {next.location && <span>{next.location}</span>}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="font-mono text-[32px] font-bold leading-none" style={{ color: c.dot }}>
            {days}
          </div>
          {opp?.record && (
            <div className="text-[12px] text-muted-foreground mt-0.5">
              Their record: {opp.record.wins}–{opp.record.losses}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-5 flex-wrap">
        {hasReport ? (
          <>
            <Link href={`/app/coach/scouting/${next.opponentId}`}>
              <a>
                <Button style={{ background: c.dot, borderColor: c.border }} className="text-white shadow-sm gap-1.5">
                  <Crosshair className="w-3.5 h-3.5" />
                  Open scout report
                </Button>
              </a>
            </Link>
            {sm && (
              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
                style={{ color: sm.color, background: sm.bg, borderColor: sm.border }}
              >
                {sm.label}
              </span>
            )}
          </>
        ) : (
          <Link href={`/app/coach/scouting/${next.opponentId}`}>
            <a>
              <Button variant="outline" className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Start scout report
              </Button>
            </a>
          </Link>
        )}

        {report && (
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1"><Target className="w-3 h-3" />{report.keysToWin.length} keys</span>
            <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{report.offenseTendencies.length + report.defenseTendencies.length} tendencies</span>
            <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{report.keyPlayers.length} key players</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Opponent card ──────────────────────────────────────────────────────────

function OpponentCard({ opp }: { opp: Opponent }) {
  const hue = opp.primaryColor ? Number(opp.primaryColor) : 200;
  const c = teamColor(hue);
  const reports = mockScoutReports.filter((r) => r.opponentId === opp.id);
  const latestReport = reports[0];
  const sm = latestReport ? statusMeta(latestReport.status) : null;

  return (
    <Link href={`/app/coach/scouting/${opp.id}`} asChild>
      <a className="block rounded-xl border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Team chip */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-bold border shrink-0"
              style={{ color: c.text, background: c.bg, borderColor: c.border }}
            >
              {opp.abbreviation ?? opp.name.slice(0, 3).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[14px] truncate">{opp.name}</div>
              <div className="text-[11.5px] text-muted-foreground mt-0.5 flex flex-wrap gap-2">
                {opp.conference && <span>{opp.conference}</span>}
                {opp.coachName && <span>{opp.coachName}</span>}
              </div>
            </div>
            {opp.record && (
              <div className="text-right shrink-0">
                <div className="font-mono font-bold text-[14px]">{opp.record.wins}–{opp.record.losses}</div>
                <div className="text-[10px] text-muted-foreground">record</div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 mt-3 flex-wrap">
            {sm && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                style={{ color: sm.color, background: sm.bg, borderColor: sm.border }}
              >
                {sm.label} report
              </span>
            )}
            {reports.length === 0 && (
              <span className="text-[10px] text-muted-foreground">No report yet</span>
            )}
            <div className="flex items-center gap-2 ml-auto text-[10.5px] text-muted-foreground">
              {opp.filmSessionIds.length > 0 && (
                <span className="flex items-center gap-0.5"><Film className="w-3 h-3" />{opp.filmSessionIds.length}</span>
              )}
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
          </div>
        </div>
      </a>
    </Link>
  );
}

// ── Quick stats strip ──────────────────────────────────────────────────────

function QuickStat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
      <div className="font-mono text-[24px] font-bold leading-none">{value}</div>
      <div className="text-[11px] font-semibold text-muted-foreground mt-1">{label}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function ScoutingHubPage() {
  const [query, setQuery] = useState("");

  const filtered = mockOpponents.filter((o) =>
    o.name.toLowerCase().includes(query.toLowerCase()) ||
    (o.conference ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  const totalReports  = mockScoutReports.length;
  const finalReports  = mockScoutReports.filter((r) => r.status === "final").length;
  const draftReports  = mockScoutReports.filter((r) => r.status === "draft").length;

  return (
    <AppShell>
      <PageHeader
        title="Scouting"
        subtitle="Opponent profiles, scout reports, and game prep"
        actions={
          <Button className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> New opponent
          </Button>
        }
      />

      {/* Next game */}
      <div className="mb-6">
        <NextGameHero />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
        <QuickStat label="Opponents" value={mockOpponents.length} sub="in database" />
        <QuickStat label="Reports" value={totalReports} />
        <QuickStat label="Final" value={finalReports} sub="game-ready" />
        <QuickStat label="Draft" value={draftReports} sub="in progress" />
      </div>

      {/* Search + opponent list */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-semibold text-[16px]">All Opponents</h2>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search opponents…"
            className="pl-8 h-8 text-[12px]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 flex flex-col items-center text-center gap-3">
          <Crosshair className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-[13px] text-muted-foreground">No opponents match your search.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((opp) => (
            <OpponentCard key={opp.id} opp={opp} />
          ))}
        </div>
      )}

      {/* Completed reports */}
      <div className="mt-8">
        <h2 className="font-semibold text-[16px] mb-4">Recent Scout Reports</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border/50">
          {mockScoutReports.map((report) => {
            const sm = statusMeta(report.status);
            const opp = mockOpponents.find((o) => o.id === report.opponentId);
            const hue = opp?.primaryColor ? Number(opp.primaryColor) : 200;
            const c = teamColor(hue);
            return (
              <Link key={report.id} href={`/app/coach/scouting/${report.opponentId}`} asChild>
                <a className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border shrink-0"
                    style={{ color: c.text, background: c.bg, borderColor: c.border }}
                  >
                    {opp?.abbreviation ?? report.opponentName.slice(0, 3).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">vs. {report.opponentName}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 flex gap-3">
                      {report.gameDate && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatGameDate(report.gameDate)}</span>}
                      <span>{report.keysToWin.length} keys · {report.keyPlayers.length} players scouted</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                      style={{ color: sm.color, background: sm.bg, borderColor: sm.border }}
                    >
                      {sm.label}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                  </div>
                </a>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
