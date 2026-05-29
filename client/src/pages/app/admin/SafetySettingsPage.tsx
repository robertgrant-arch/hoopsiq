/**
 * SafetySettingsPage — admin configuration for communication safety policies.
 *
 * Covers:
 *   • Guardian policy (require all guardians, require second adult)
 *   • Quiet hours (enable/disable, allowed window, org timezone)
 *   • Platform safety (social handle sharing flag)
 *   • Data retention period
 */

import { useState, useEffect } from "react";
import { Shield, Clock, Database } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SafetySettings {
  requireAllGuardians:               boolean;
  requireSecondAdultForTeamThreads:  boolean;
  quietHoursEnabled:                 boolean;
  allowedStartHour:                  number;
  allowedEndHour:                    number;
  orgTimezone:                       string;
  allowSocialHandleSharing:          boolean;
  messageRetentionDays:              number;
}

// ── Section header ────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  icon:        React.ElementType;
  iconColor:   string;
  iconBg:      string;
  title:       string;
  description: string;
}

function SectionHeader({ icon: Icon, iconColor, iconBg, title, description }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
      </div>
      <div>
        <h3 className="text-[13.5px] font-semibold">{title}</h3>
        <p className="text-[11.5px] text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// ── Setting row ───────────────────────────────────────────────────────────────

interface SettingRowProps {
  label:    string;
  helper?:  string;
  control:  React.ReactNode;
}

function SettingRow({ label, helper, control }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <Label className="text-[13px]">{label}</Label>
        {helper && (
          <p className="text-[11.5px] text-muted-foreground mt-0.5 max-w-sm leading-relaxed">
            {helper}
          </p>
        )}
      </div>
      <div className="ml-4 shrink-0">{control}</div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "Pacific/Honolulu",
  "America/Anchorage",
];

export default function SafetySettingsPage() {
  const [form, setForm] = useState<SafetySettings | null>(null);
  const queryClient = useQueryClient();

  const { data: queryData, isLoading } = useQuery<SafetySettings>({
    queryKey: ["safety-settings"],
    queryFn:  () => apiFetch<SafetySettings>("/safety/settings"),
  });

  useEffect(() => {
    if (queryData && form === null) {
      setForm(queryData);
    }
  }, [queryData]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDirty =
    form !== null &&
    queryData !== undefined &&
    JSON.stringify(form) !== JSON.stringify(queryData);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (body: SafetySettings) =>
      apiFetch("/safety/settings", {
        method: "PUT",
        body:   JSON.stringify(body),
      }),
    onSuccess: () => {
      toast.success("Settings saved");
      queryClient.invalidateQueries({ queryKey: ["safety-settings"] });
    },
    onError: () => toast.error("Failed to save settings"),
  });

  function field<K extends keyof SafetySettings>(k: K, v: SafetySettings[K]) {
    setForm((prev) => (prev ? { ...prev, [k]: v } : prev));
  }

  const clampHour = (v: number) => Math.max(0, Math.min(23, v));

  return (
    <AppShell>
      <PageHeader
        title="Safety Settings"
        description="Configure communication safety policies for your organization."
      />

      <div className="p-6 max-w-2xl mx-auto space-y-8">

        {isLoading || !form ? (
          <div className="flex items-center justify-center py-16 text-[12px] text-muted-foreground">
            Loading settings…
          </div>
        ) : (
          <>
            {/* ── Section 1: Guardian Policy ─────────────────────────────── */}
            <section>
              <SectionHeader
                icon={Shield}
                iconColor="#10b981"
                iconBg="rgba(16,185,129,0.12)"
                title="Guardian Policy"
                description="Controls who must be included when communicating with minor athletes."
              />

              <SettingRow
                label="Require all guardians"
                helper="When enabled, all guardians on file must receive a copy, not just the primary."
                control={
                  <Switch
                    checked={form.requireAllGuardians}
                    onCheckedChange={(v) => field("requireAllGuardians", v)}
                  />
                }
              />

              <SettingRow
                label="Require second adult for team threads"
                helper="Team messages involving minors require an additional staff witness."
                control={
                  <Switch
                    checked={form.requireSecondAdultForTeamThreads}
                    onCheckedChange={(v) => field("requireSecondAdultForTeamThreads", v)}
                  />
                }
              />
            </section>

            <Separator />

            {/* ── Section 2: Quiet Hours ─────────────────────────────────── */}
            <section>
              <SectionHeader
                icon={Clock}
                iconColor="#0ea5e9"
                iconBg="rgba(14,165,233,0.12)"
                title="Quiet Hours"
                description="Restrict when coaches can message minor athletes."
              />

              <SettingRow
                label="Enforce quiet hours"
                control={
                  <Switch
                    checked={form.quietHoursEnabled}
                    onCheckedChange={(v) => field("quietHoursEnabled", v)}
                  />
                }
              />

              {form.quietHoursEnabled && (
                <>
                  <SettingRow
                    label="Allowed start hour (0–23)"
                    control={
                      <Input
                        type="number"
                        min={0}
                        max={23}
                        className="w-20 h-8 text-[12px]"
                        value={form.allowedStartHour}
                        onChange={(e) =>
                          field("allowedStartHour", clampHour(parseInt(e.target.value) || 0))
                        }
                      />
                    }
                  />

                  <SettingRow
                    label="Allowed end hour (0–23)"
                    control={
                      <Input
                        type="number"
                        min={0}
                        max={23}
                        className="w-20 h-8 text-[12px]"
                        value={form.allowedEndHour}
                        onChange={(e) =>
                          field("allowedEndHour", clampHour(parseInt(e.target.value) || 0))
                        }
                      />
                    }
                  />

                  <SettingRow
                    label="Organization timezone"
                    control={
                      <Select
                        value={form.orgTimezone}
                        onValueChange={(v) => field("orgTimezone", v)}
                      >
                        <SelectTrigger className="h-8 w-[200px] text-[12px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz} value={tz} className="text-[12px]">
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    }
                  />
                </>
              )}
            </section>

            <Separator />

            {/* ── Section 3: Platform Safety ─────────────────────────────── */}
            <section>
              <SectionHeader
                icon={Shield}
                iconColor="#f59e0b"
                iconBg="rgba(245,158,11,0.12)"
                title="Platform Safety"
                description="Control what content is flagged in communications."
              />

              <SettingRow
                label="Allow social media handle sharing"
                helper="When disabled (recommended), messages containing social handles are auto-flagged medium severity."
                control={
                  <Switch
                    checked={form.allowSocialHandleSharing}
                    onCheckedChange={(v) => field("allowSocialHandleSharing", v)}
                  />
                }
              />
            </section>

            <Separator />

            {/* ── Section 4: Data Retention ──────────────────────────────── */}
            <section>
              <SectionHeader
                icon={Database}
                iconColor="#8b5cf6"
                iconBg="rgba(139,92,246,0.12)"
                title="Data Retention"
                description="How long message records are kept for compliance."
              />

              <SettingRow
                label="Retention period (days)"
                helper="Min 30 days, max 3650 days (10 years). Affects compliance export availability."
                control={
                  <Input
                    type="number"
                    min={30}
                    max={3650}
                    className="w-24 h-8 text-[12px]"
                    value={form.messageRetentionDays}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 30;
                      field("messageRetentionDays", Math.max(30, Math.min(3650, v)));
                    }}
                  />
                }
              />
            </section>

            {/* ── Save ──────────────────────────────────────────────────────── */}
            <div className="flex justify-end mt-4">
              <Button
                disabled={!isDirty || isPending}
                onClick={() => form && save(form)}
                className="w-full sm:w-auto"
              >
                {isPending ? "Saving…" : "Save Settings"}
              </Button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
