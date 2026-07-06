/**
 * UserManagementPage — /app/admin/users
 *
 * Admin (SUPER_ADMIN) console for first-party auth accounts: create users
 * with a role and temporary password, change roles, activate/deactivate,
 * reset passwords, and remove accounts. Backed by /api/auth/users.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  ArrowLeft,
  UserPlus,
  KeyRound,
  Trash2,
  ShieldCheck,
  ShieldOff,
  Loader2,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api/client";
import { ROLE_META, type Role } from "@/lib/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ManagedUser = {
  id: string;
  email: string;
  name: string;
  portalRole: Role;
  active: boolean;
  mustChangePassword: boolean;
  createdAt: string;
};

const ALL_ROLES: Role[] = ["ATHLETE", "COACH", "TEAM_ADMIN", "EXPERT", "PARENT", "SUPER_ADMIN"];

function useUsers() {
  return useQuery({
    queryKey: ["auth-users"],
    queryFn: () => apiGet<{ users: ManagedUser[] }>("/auth/users").then((r) => r.users),
  });
}

function CreateUserForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRoleValue] = useState<Role>("ATHLETE");
  const [password, setPassword] = useState("");

  const create = useMutation({
    mutationFn: () => apiPost("/auth/users", { email, name, portalRole: role, password }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth-users"] });
      toast.success(`Account created for ${name}. Share the temporary password securely.`);
      onDone();
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not create user"),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate();
      }}
      className="rounded-xl border border-border bg-card p-5 space-y-3"
    >
      <h2 className="display text-[15px] flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-muted-foreground" /> New user
      </h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <input
          required
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-primary/60"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-primary/60"
        />
        <select
          value={role}
          onChange={(e) => setRoleValue(e.target.value as Role)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-primary/60"
        >
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_META[r].label}
            </option>
          ))}
        </select>
        <input
          required
          type="text"
          placeholder="Temporary password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          className="rounded-lg border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-primary/60 font-mono"
        />
      </div>
      <p className="text-[12px] text-muted-foreground">
        The user will be asked to change this password after their first sign-in.
      </p>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={create.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-[13px] font-semibold hover:brightness-110 disabled:opacity-60 transition"
        >
          {create.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Create account
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-4 py-2 rounded-lg border border-border text-[13px] hover:bg-muted transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function UserRow({ user }: { user: ManagedUser }) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["auth-users"] });

  const patch = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiPatch(`/auth/users/${user.id}`, body),
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e?.message ?? "Update failed"),
  });
  const remove = useMutation({
    mutationFn: () => apiDelete(`/auth/users/${user.id}`),
    onSuccess: () => {
      invalidate();
      toast.success(`${user.name} removed.`);
    },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });

  function resetPassword() {
    const pw = window.prompt(`New temporary password for ${user.name} (min 8 characters):`);
    if (!pw) return;
    if (pw.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    patch.mutate(
      { password: pw },
      { onSuccess: () => toast.success("Password reset. Share it securely.") },
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex-1 min-w-[180px]">
        <div className="text-[14px] font-semibold flex items-center gap-2">
          {user.name}
          {!user.active && (
            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              Deactivated
            </span>
          )}
          {user.mustChangePassword && (
            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              Temp password
            </span>
          )}
        </div>
        <div className="text-[12.5px] text-muted-foreground">{user.email}</div>
      </div>

      <select
        value={user.portalRole}
        disabled={patch.isPending}
        onChange={(e) => patch.mutate({ portalRole: e.target.value })}
        className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-[12.5px] outline-none focus:border-primary/60"
        style={{ color: ROLE_META[user.portalRole]?.color }}
      >
        {ALL_ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_META[r].label}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1.5">
        <button
          title={user.active ? "Deactivate" : "Reactivate"}
          disabled={patch.isPending}
          onClick={() => patch.mutate({ active: !user.active })}
          className="p-2 rounded-lg border border-border hover:bg-muted transition"
        >
          {user.active ? (
            <ShieldCheck className="w-4 h-4 text-[oklch(0.75_0.12_140)]" />
          ) : (
            <ShieldOff className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        <button
          title="Reset password"
          disabled={patch.isPending}
          onClick={resetPassword}
          className="p-2 rounded-lg border border-border hover:bg-muted transition"
        >
          <KeyRound className="w-4 h-4 text-muted-foreground" />
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              title="Delete user"
              className="p-2 rounded-lg border border-destructive/30 hover:bg-destructive/10 transition"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove {user.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Their account is deactivated and personal data anonymized. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => remove.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remove user
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function UserManagementPage() {
  const { data: users, isLoading, isError, refetch } = useUsers();
  const [creating, setCreating] = useState(false);

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/app/settings" asChild>
            <a className="p-1.5 rounded-lg hover:bg-muted transition" aria-label="Back">
              <ArrowLeft className="w-4.5 h-4.5" />
            </a>
          </Link>
          <div className="flex-1">
            <h1 className="display text-2xl">Users</h1>
            <p className="text-[13px] text-muted-foreground">
              Create and manage HoopsIQ accounts for your program.
            </p>
          </div>
          {!creating && (
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-[13px] font-semibold hover:brightness-110 transition"
            >
              <UserPlus className="w-4 h-4" />
              New user
            </button>
          )}
        </div>

        {creating && <CreateUserForm onDone={() => setCreating(false)} />}

        {isLoading && (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 flex items-center justify-between">
            <p className="text-[13.5px] text-destructive">
              Couldn't load users. You need admin access for this page.
            </p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 rounded-lg border border-border text-[13px] hover:bg-muted transition"
            >
              Retry
            </button>
          </div>
        )}

        {users && users.length === 0 && (
          <p className="text-[13.5px] text-muted-foreground">No users yet.</p>
        )}
        {users && users.map((u) => <UserRow key={u.id} user={u} />)}
      </div>
    </AppShell>
  );
}
