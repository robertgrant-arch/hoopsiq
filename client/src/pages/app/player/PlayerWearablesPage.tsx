import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type ConnectionStatus = "connected" | "pending" | "disconnected";

interface Provider {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  status: ConnectionStatus;
  lastSynced: string | null;
}

interface DailyMetrics {
  recoveryScore: number;
  hrv: number;
  restingHR: number;
  sleepScore: number;
  sleepDurationHrs: number;
  sleepDurationMins: number;
  strain: number;
  steps: number;
  activeCalories: number;
}

interface SharingSettings {
  recoveryHrv: boolean;
  sleep: boolean;
  strainActivity: boolean;
  heartRate: boolean;
  shareWithTeam: boolean;
}

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const PROVIDERS: Provider[] = [
  {
    id: "whoop",
    name: "WHOOP",
    tagline: "Recovery & Strain",
    emoji: "💪",
    status: "connected",
    lastSynced: "3 min ago",
  },
  {
    id: "garmin",
    name: "Garmin",
    tagline: "GPS & Activity",
    emoji: "🏃",
    status: "disconnected",
    lastSynced: null,
  },
  {
    id: "oura",
    name: "Oura",
    tagline: "Sleep & Readiness",
    emoji: "💍",
    status: "disconnected",
    lastSynced: null,
  },
];

const MOCK_METRICS: DailyMetrics = {
  recoveryScore: 74,
  hrv: 68,
  restingHR: 52,
  sleepScore: 81,
  sleepDurationHrs: 8,
  sleepDurationMins: 14,
  strain: 11.4,
  steps: 9842,
  activeCalories: 487,
};

const RECOVERY_HISTORY = [
  { day: "Mon", score: 62 },
  { day: "Tue", score: 55 },
  { day: "Wed", score: 48 },
  { day: "Thu", score: 71 },
  { day: "Fri", score: 79 },
  { day: "Sat", score: 66 },
  { day: "Sun", score: 74 },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function recoveryColor(score: number): string {
  if (score >= 67) return "oklch(0.6 0.15 145)";
  if (score >= 34) return "oklch(0.75 0.15 85)";
  return "oklch(0.55 0.2 25)";
}

function statusBadge(status: ConnectionStatus) {
  if (status === "connected") {
    return (
      <Badge className="text-[10.5px] px-2 py-0.5 bg-[oklch(0.6_0.15_145_/_0.15)] text-[oklch(0.6_0.15_145)] border border-[oklch(0.6_0.15_145_/_0.35)]">
        Connected
      </Badge>
    );
  }
  if (status === "pending") {
    return (
      <Badge className="text-[10.5px] px-2 py-0.5 bg-[oklch(0.75_0.15_85_/_0.15)] text-[oklch(0.75_0.15_85)] border border-[oklch(0.75_0.15_85_/_0.35)]">
        Pending
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10.5px] px-2 py-0.5 text-muted-foreground">
      Disconnected
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

function ProviderCard({
  provider,
  onConnect,
  onDisconnect,
}: {
  provider: Provider;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
            {provider.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-[14px]">{provider.name}</span>
            </div>
            <div className="text-[12px] text-muted-foreground mt-0.5">{provider.tagline}</div>
          </div>
        </div>
        {statusBadge(provider.status)}
      </div>

      {provider.status === "connected" && provider.lastSynced && (
        <div className="text-[12px] text-muted-foreground flex items-center gap-1.5">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: "oklch(0.6 0.15 145)" }}
          />
          Last synced: {provider.lastSynced}
        </div>
      )}

      <div className="flex items-center gap-2 mt-auto pt-1">
        {provider.status === "connected" ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDisconnect(provider.id)}
          >
            Disconnect
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={() => onConnect(provider.id)}
          >
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit?: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1.5">
      <div className="text-[10.5px] text-muted-foreground uppercase tracking-wide font-mono">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className="text-3xl font-bold leading-none tabular-nums"
          style={color ? { color } : undefined}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[12px] text-muted-foreground font-medium">{unit}</span>
        )}
      </div>
    </div>
  );
}

function RecoveryBar({ day, score }: { day: string; score: number }) {
  const color = recoveryColor(score);
  const heightPct = Math.round((score / 100) * 100);
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <span
        className="text-[10px] font-mono font-semibold"
        style={{ color }}
      >
        {score}
      </span>
      <div className="w-full h-20 flex items-end rounded-sm overflow-hidden bg-muted/40">
        <div
          className="w-full rounded-sm transition-all"
          style={{
            height: `${heightPct}%`,
            background: color,
            opacity: 0.85,
          }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground font-mono">{day}</span>
    </div>
  );
}

function SharingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-medium">{label}</div>
        {description && (
          <div className="text-[12px] text-muted-foreground mt-0.5">{description}</div>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export function PlayerWearablesPage() {
  const [providers, setProviders] = useState<Provider[]>(PROVIDERS);
  const [sharing, setSharing] = useState<SharingSettings>({
    recoveryHrv: true,
    sleep: true,
    strainActivity: false,
    heartRate: false,
    shareWithTeam: false,
  });

  const hasConnected = providers.some((p) => p.status === "connected");

  function handleConnect(id: string) {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "pending" } : p))
    );
  }

  function handleDisconnect(id: string) {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "disconnected", lastSynced: null } : p))
    );
  }

  function updateSharing(key: keyof SharingSettings) {
    return (v: boolean) => setSharing((prev) => ({ ...prev, [key]: v }));
  }

  const m = MOCK_METRICS;
  const recColor = recoveryColor(m.recoveryScore);
  const sleepColor = recoveryColor(m.sleepScore);

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1200px] mx-auto">
        <PageHeader
          eyebrow="Fitness & Recovery"
          title="Wearables"
          subtitle="Connect your devices to track recovery, sleep, and strain. Control what your coach and teammates can see."
        />

        <div className="flex flex-col gap-8">
          {/* ---------------------------------------------------------------- */}
          {/* Connected Devices                                                 */}
          {/* ---------------------------------------------------------------- */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-semibold text-[15px]">Connected Devices</h2>
              <Badge variant="outline" className="text-[10.5px] font-mono">
                {providers.filter((p) => p.status === "connected").length} connected
              </Badge>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {providers.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                />
              ))}
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Today's Metrics                                                   */}
          {/* ---------------------------------------------------------------- */}
          {hasConnected && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-semibold text-[15px]">Today's Metrics</h2>
                <span className="text-[12px] text-muted-foreground">
                  from WHOOP · synced 3 min ago
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <MetricCard
                  label="Recovery Score"
                  value={String(m.recoveryScore)}
                  unit="%"
                  color={recColor}
                />
                <MetricCard
                  label="HRV"
                  value={String(m.hrv)}
                  unit="ms"
                />
                <MetricCard
                  label="Resting Heart Rate"
                  value={String(m.restingHR)}
                  unit="bpm"
                />
                <MetricCard
                  label="Sleep Score"
                  value={String(m.sleepScore)}
                  unit="%"
                  color={sleepColor}
                />
                <MetricCard
                  label="Sleep Duration"
                  value={`${m.sleepDurationHrs}h ${m.sleepDurationMins}m`}
                />
                <MetricCard
                  label="Strain"
                  value={m.strain.toFixed(1)}
                  unit="/ 21"
                />
                <MetricCard
                  label="Steps"
                  value={m.steps.toLocaleString()}
                />
                <MetricCard
                  label="Active Calories"
                  value={m.activeCalories.toLocaleString()}
                  unit="kcal"
                />
              </div>
            </section>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Metric History                                                    */}
          {/* ---------------------------------------------------------------- */}
          {hasConnected && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-semibold text-[15px]">Recovery Trend</h2>
                <span className="text-[12px] text-muted-foreground">Last 7 days</span>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-end gap-2 h-28 px-1">
                  {RECOVERY_HISTORY.map((entry) => (
                    <RecoveryBar key={entry.day} day={entry.day} score={entry.score} />
                  ))}
                </div>
                <div className="flex items-center gap-5 mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "oklch(0.6 0.15 145)" }} />
                    <span className="text-[11px] text-muted-foreground">≥ 67 — Green</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "oklch(0.75 0.15 85)" }} />
                    <span className="text-[11px] text-muted-foreground">34–66 — Amber</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "oklch(0.55 0.2 25)" }} />
                    <span className="text-[11px] text-muted-foreground">≤ 33 — Red</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Sharing Settings                                                  */}
          {/* ---------------------------------------------------------------- */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-semibold text-[15px]">Sharing Settings</h2>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-mono mb-1">
                Share with coaches
              </div>
              <div className="divide-y divide-border/60">
                <SharingToggle
                  label="Recovery & HRV"
                  description="Daily recovery score and heart rate variability"
                  checked={sharing.recoveryHrv}
                  onChange={updateSharing("recoveryHrv")}
                />
                <SharingToggle
                  label="Sleep Data"
                  description="Sleep score, duration, and quality breakdown"
                  checked={sharing.sleep}
                  onChange={updateSharing("sleep")}
                />
                <SharingToggle
                  label="Strain & Activity"
                  description="Daily strain score, steps, and active calories"
                  checked={sharing.strainActivity}
                  onChange={updateSharing("strainActivity")}
                />
                <SharingToggle
                  label="Heart Rate"
                  description="Resting heart rate and HR during workouts"
                  checked={sharing.heartRate}
                  onChange={updateSharing("heartRate")}
                />
              </div>

              <div className="mt-5 pt-5 border-t border-border">
                <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-mono mb-1">
                  Also share with
                </div>
                <SharingToggle
                  label="Entire Team"
                  description="Teammates can see your fitness status (ready / caution / at risk)"
                  checked={sharing.shareWithTeam}
                  onChange={updateSharing("shareWithTeam")}
                />
              </div>

              <div className="mt-4 rounded-lg bg-muted/50 px-4 py-3 text-[12px] text-muted-foreground leading-relaxed">
                🔒 You can change these settings at any time. Coaches only see what you choose to share.
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

export default PlayerWearablesPage;
