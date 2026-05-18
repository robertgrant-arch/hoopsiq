/**
 * AdminTeamsPage — Multi-team management.
 *
 * Lists all teams, shows roster counts, and allows creating/editing teams.
 */
import { useState } from "react";
import {
  Users, Plus, Edit2, ChevronRight, UserCheck, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTeams, useSeasons, useCreateTeam, useUpdateTeam } from "@/lib/api/hooks/useAdmin";
import type { Team } from "@/features/admin/mock";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const AGE_GROUPS = ["u8","u10","u12","u13","u14","u15","u16","u17","u18","varsity","jv","freshman","adult","other"];
const GENDERS = ["boys","girls","co_ed","open"];

function ageLabel(a: string) {
  if (a.startsWith("u")) return a.toUpperCase();
  return a.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* -------------------------------------------------------------------------- */
/* Team form                                                                    */
/* -------------------------------------------------------------------------- */

function TeamForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Partial<Team>;
  onSubmit: (data: Partial<Team>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [ageGroup, setAgeGroup] = useState(initial?.ageGroup ?? "other");
  const [gender, setGender] = useState(initial?.gender ?? "boys");
  const [headCoach, setHeadCoach] = useState(initial?.headCoachName ?? "");

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h3 className="font-semibold text-[14px]">{initial?.id ? "Edit team" : "New team"}</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[12px] font-medium block mb-1">Team name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="17U Boys Varsity" className="text-[12px]" />
        </div>
        <div>
          <label className="text-[12px] font-medium block mb-1">Head coach</label>
          <Input value={headCoach} onChange={(e) => setHeadCoach(e.target.value)} placeholder="Coach Name" className="text-[12px]" />
        </div>
        <div>
          <label className="text-[12px] font-medium block mb-1">Age group</label>
          <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background text-[12px] px-2">
            {AGE_GROUPS.map((a) => <option key={a} value={a}>{ageLabel(a)}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[12px] font-medium block mb-1">Gender</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background text-[12px] px-2">
            {GENDERS.map((g) => <option key={g} value={g}>{ageLabel(g)}</option>)}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" disabled={!name || loading} onClick={() => onSubmit({ name, ageGroup, gender, headCoachName: headCoach })}
          style={{ background: "oklch(0.72 0.18 290)" }} className="gap-1.5 text-white">
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {initial?.id ? "Save changes" : "Create team"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Team card                                                                    */
/* -------------------------------------------------------------------------- */

function TeamCard({ team, onEdit }: { team: Team; onEdit: (t: Team) => void }) {
  const fillPct = team.rosterCount > 0 ? Math.min(100, team.rosterCount / 15 * 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-[11px] text-center leading-tight"
        style={{ background: team.colorPrimary ?? "oklch(0.72 0.18 290)" }}
      >
        {team.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-[14px]">{team.name}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {ageLabel(team.ageGroup)} · {ageLabel(team.gender)}
              {team.headCoachName && ` · ${team.headCoachName}`}
            </p>
          </div>
          <button
            onClick={() => onEdit(team)}
            className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span>{team.rosterCount} players</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${fillPct}%`, background: team.colorPrimary ?? "oklch(0.72 0.18 290)" }} />
            </div>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {team.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main                                                                         */
/* -------------------------------------------------------------------------- */

export default function AdminTeamsPage() {
  const [seasonFilter, setSeasonFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Team | null>(null);

  const { data: seasons = [] } = useSeasons();
  const { data: teams = [], isLoading } = useTeams({ seasonId: seasonFilter || undefined });
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();

  async function handleCreate(data: Partial<Team>) {
    try {
      await createTeam.mutateAsync(data);
      toast.success("Team created");
      setShowForm(false);
    } catch { toast.error("Failed to create team"); }
  }

  async function handleUpdate(data: Partial<Team>) {
    if (!editTarget) return;
    try {
      await updateTeam.mutateAsync({ id: editTarget.id!, ...data });
      toast.success("Team updated");
      setEditTarget(null);
    } catch { toast.error("Failed to update team"); }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Club Admin"
        title="Teams"
        subtitle="Manage your program's teams and rosters."
        actions={
          <Button size="sm" onClick={() => setShowForm(true)} style={{ background: "oklch(0.72 0.18 290)" }} className="gap-1.5 text-white">
            <Plus className="w-3.5 h-3.5" /> New team
          </Button>
        }
      />

      {/* Season filter */}
      <div className="flex gap-3 mb-5">
        <select value={seasonFilter} onChange={(e) => setSeasonFilter(e.target.value)} className="h-8 rounded-md border border-border bg-card text-[12px] px-2">
          <option value="">All seasons</option>
          {seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="space-y-4">
        {showForm && !editTarget && (
          <TeamForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} loading={createTeam.isPending} />
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : teams.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-6 py-12 flex flex-col items-center text-center gap-3">
            <UserCheck className="w-8 h-8 text-muted-foreground/30" />
            <p className="font-semibold">No teams yet</p>
            <p className="text-[12px] text-muted-foreground">Create your first team to get started.</p>
            <Button size="sm" onClick={() => setShowForm(true)} style={{ background: "oklch(0.72 0.18 290)" }} className="gap-1 text-white">
              <Plus className="w-3.5 h-3.5" /> New team
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {teams.map((team) =>
              editTarget?.id === team.id ? (
                <div key={team.id} className="sm:col-span-2">
                  <TeamForm
                    initial={editTarget}
                    onSubmit={handleUpdate}
                    onCancel={() => setEditTarget(null)}
                    loading={updateTeam.isPending}
                  />
                </div>
              ) : (
                <TeamCard key={team.id} team={team} onEdit={setEditTarget} />
              )
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
