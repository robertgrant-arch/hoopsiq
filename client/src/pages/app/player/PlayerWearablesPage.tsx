import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import {
  useMyConnections,
  useMyMetrics,
  useMyMetricsHistory,
  useMySharing,
  useUpdateSharing,
  useConnectProvider,
  useDisconnectProvider,
  type WearableProvider,
  type WearableConnection,
  type WearableMetrics,
  type WearableSharing,
} from "@/lib/api/hooks/useWearables";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type ConnectionStatus = "connected" | "pending" | "disconnected";

interface ProviderView {
  id: WearableProvider;
  name: string;
  tagline: string;
  emoji: string;
  status: ConnectionStatus;
  lastSynced: string | null;
}

/* -------------------------------------------------------------------------- */
/* Provider catalog (static display metadata)                                  */
/* -------------------------------------------------------------------------- */

const PROVIDER_META: Record<WearableProvider, { name: string; tagline: string; emoji: string }> = {
  whoop:        { name: "WHOOP",        tagline: "Recovery & Strain",  emoji: "💪" },
  garmin:       { name: "Garmin",       tagline: "GPS & Activity",     emoji: "🏃" },
  oura:         { name: "Oura",         tagline: "Sleep & Readiness",  emoji: "💍" },
  apple_health: { name: "Apple Health", tagline: "Health & Activity",  emoji: "🍎" },
};

/** Providers always offered for connection (apple_health shows only if the API
 *  reports an existing connection). */
const DEFAULT_PROVIDERS: WearableProvider[] = ["whoop", "garmin", "oura"];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function recoveryColor(score: number): string {
  if (score >= 67) return "oklch(0.6 0.15 145)";
  if (score >= 34) return "oklch(0.75 0.15 85)";
  return "oklch(0.55 0.2 25)";
}

function timeAgo(iso: string | null): string | null {
  if (!iso) return null;
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function toConnectionStatus(status: string): ConnectionStatus {
  if (status === "connected" || status === "pending") return status;
  return "disconnected";
}

function buildProviderViews(connections: WearableConnection[]): ProviderView[] {
  const ids = new Set<WearableProvider>(DEFAULT_PROVIDERS);
  connections.forEach((c) => {
    if (c.provider in PROVIDER_META) ids.add(c.provider);
  });
  return Array.from(ids).map((id) => {
    const conn = connections.find((c) => c.provider === id);
    return {
      id,
      ...PROVIDER_META[id],
      status: conn ? toConnectionStatus(conn.status) : "disconnected",
      lastSynced: conn ? timeAgo(conn.lastSyncedAt) : null,
    };
  });
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
  provider: ProviderView;
  onConnect: (id: WearableProvider) => void;
  onDisconnect: (id: WearableProvider) => void;
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

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-card px-6 py-10 flex flex-col items-center text-center gap-3">
      <p className="font-semibold">{message}</p>
      <p className="text-[12px] text-muted-foreground">Check your connection and try again.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export function PlayerWearablesPage() {
  const connections = useMyConnections();
  const metrics = useMyMetrics();
  const history = useMyMetricsHistory(7);
  const sharingQuery = useMySharing();
  const updateSharing = useUpdateSharing();
  const connectProvider = useConnectProvider();
  const disconnectProvider = useDisconnectProvider();

  const providers = buildProviderViews(connections.data ?? []);
  const hasConnected = providers.some((p) => p.status === "connected");

  const today: WearableMetrics | undefined = metrics.data?.[0];
  const recoveryHistory = (history.data ?? [])
    .filter((m) => m.recoveryScore != null)
    .slice(-7)
    .map((m) => ({
      day: new Date(`${m.recordedDate}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" }),
      score: m.recoveryScore as number,
    }));

  const sharing = sharingQuery.data;

  function handleConnect(id: WearableProvider) {
    connectProvider.mutate(id, {
      onSuccess: (res) => {
        if (res.authUrl) {
          window.open(res.authUrl, "_blank", "noopener");
        }
      },
      onError: () => toast.error("Couldn't start the connection — try again."),
    });
  }

  function handleDisconnect(id: WearableProvider) {
    disconnectProvider.mutate(id, {
      onError: () => toast.error("Couldn't disconnect — try again."),
    });
  }

  function updateSharingField(key: keyof WearableSharing) {
    return (v: boolean) => {
      updateSharing.mutate(
        { [key]: v },
        { onError: () => toast.error("Couldn't save sharing settings — try again.") },
      );
    };
  }

  const recColor = today?.recoveryScore != null ? recoveryColor(today.recoveryScore) : undefined;
  const sleepColor = today?.sleepScore != null ? recoveryColor(today.sleepScore) : undefined;

  const syncedFrom = today
    ? `from ${PROVIDER_META[today.provider as WearableProvider]?.name ?? today.provider}` +
      (providers.find((p) => p.id === today.provider)?.lastSynced
        ? ` · synced ${providers.find((p) => p.id === today.provider)?.lastSynced}`
        : "")
    : "";

  const sleepHrs = today?.sleepDurationMins != null ? Math.floor(today.sleepDurationMins / 60) : null;
  const sleepMins = today?.sleepDurationMins != null ? today.sleepDurationMins % 60 : null;

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
              {!connections.isLoading && !connections.isError && (
                <Badge variant="outline" className="text-[10.5px] font-mono">
                  {providers.filter((p) => p.status === "connected").length} connected
                </Badge>
              )}
            </div>
            {connections.isLoading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <SkeletonCard lines={3} />
                <SkeletonCard lines={3} />
              </div>
            ) : connections.isError ? (
              <ErrorCard
                message="Couldn't load your devices"
                onRetry={() => connections.refetch()}
              />
            ) : (
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
            )}
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Today's Metrics                                                   */}
          {/* ---------------------------------------------------------------- */}
          {hasConnected && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-semibold text-[15px]">Today's Metrics</h2>
                {today && (
                  <span className="text-[12px] text-muted-foreground">{syncedFrom}</span>
                )}
              </div>
              {metrics.isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <SkeletonCard lines={2} />
                  <SkeletonCard lines={2} />
                  <SkeletonCard lines={2} />
                  <SkeletonCard lines={2} />
                </div>
              ) : metrics.isError ? (
                <ErrorCard
                  message="Couldn't load today's metrics"
                  onRetry={() => metrics.refetch()}
                />
              ) : !today ? (
                <div className="rounded-xl border border-border bg-card px-6 py-10 text-center text-[13px] text-muted-foreground">
                  No metrics synced yet today. Data appears after your device's next sync.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <MetricCard
                    label="Recovery Score"
                    value={today.recoveryScore != null ? String(today.recoveryScore) : "—"}
                    unit="%"
                    color={recColor}
                  />
                  <MetricCard
                    label="HRV"
                    value={today.hrv != null ? String(today.hrv) : "—"}
                    unit="ms"
                  />
                  <MetricCard
                    label="Resting Heart Rate"
                    value={today.restingHr != null ? String(today.restingHr) : "—"}
                    unit="bpm"
                  />
                  <MetricCard
                    label="Sleep Score"
                    value={today.sleepScore != null ? String(today.sleepScore) : "—"}
                    unit="%"
                    color={sleepColor}
                  />
                  <MetricCard
                    label="Sleep Duration"
                    value={sleepHrs != null ? `${sleepHrs}h ${sleepMins}m` : "—"}
                  />
                  <MetricCard
                    label="Strain"
                    value={today.strainScore != null ? today.strainScore.toFixed(1) : "—"}
                    unit="/ 21"
                  />
                  <MetricCard
                    label="Steps"
                    value={today.steps != null ? today.steps.toLocaleString() : "—"}
                  />
                  {today.activeCalories != null && (
                    <MetricCard
                      label="Active Calories"
                      value={today.activeCalories.toLocaleString()}
                      unit="kcal"
                    />
                  )}
                </div>
              )}
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
              {history.isLoading ? (
                <SkeletonCard lines={4} />
              ) : history.isError ? (
                <ErrorCard
                  message="Couldn't load your recovery trend"
                  onRetry={() => history.refetch()}
                />
              ) : recoveryHistory.length === 0 ? (
                <div className="rounded-xl border border-border bg-card px-6 py-10 text-center text-[13px] text-muted-foreground">
                  No recovery history yet. Trends appear after a few days of syncing.
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-end gap-2 h-28 px-1">
                    {recoveryHistory.map((entry, i) => (
                      <RecoveryBar key={`${entry.day}_${i}`} day={entry.day} score={entry.score} />
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
              )}
            </section>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Sharing Settings                                                  */}
          {/* ---------------------------------------------------------------- */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-semibold text-[15px]">Sharing Settings</h2>
            </div>
            {sharingQuery.isLoading ? (
              <SkeletonCard lines={5} />
            ) : sharingQuery.isError || !sharing ? (
              <ErrorCard
                message="Couldn't load your sharing settings"
                onRetry={() => sharingQuery.refetch()}
              />
            ) : (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-mono mb-1">
                  Share with coaches
                </div>
                <div className="divide-y divide-border/60">
                  <SharingToggle
                    label="Recovery & HRV"
                    description="Daily recovery score and heart rate variability"
                    checked={sharing.shareRecovery}
                    onChange={updateSharingField("shareRecovery")}
                  />
                  <SharingToggle
                    label="Sleep Data"
                    description="Sleep score, duration, and quality breakdown"
                    checked={sharing.shareSleep}
                    onChange={updateSharingField("shareSleep")}
                  />
                  <SharingToggle
                    label="Strain & Activity"
                    description="Daily strain score, steps, and active calories"
                    checked={sharing.shareStrain}
                    onChange={updateSharingField("shareStrain")}
                  />
                  <SharingToggle
                    label="Heart Rate"
                    description="Resting heart rate and HR during workouts"
                    checked={sharing.shareHeartRate}
                    onChange={updateSharingField("shareHeartRate")}
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
                    onChange={updateSharingField("shareWithTeam")}
                  />
                </div>

                <div className="mt-4 rounded-lg bg-muted/50 px-4 py-3 text-[12px] text-muted-foreground leading-relaxed">
                  🔒 You can change these settings at any time. Coaches only see what you choose to share.
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

export default PlayerWearablesPage;
