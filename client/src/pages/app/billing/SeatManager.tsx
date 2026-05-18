/**
 * SeatManager — `/app/team/seats`
 * --------------------------------------------------------------------------
 * Source: Prompt 16 §6 (seat management) + §3 (each seated player auto-grants
 * COACH50 via the Team Pro link entitlement).
 */

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Mail,
  MinusCircle,
  Plus,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { useBillingStore, addSeat, onRosterJoin, onRosterRemove, removeSeat, swapSeat, findPrice, findProduct, formatCents } from "@/lib/billing";




export function SeatManager() {
  const { user } = useAuth();
  const subs = useBillingStore((s) => s.subscriptions);
  const seats = useBillingStore((s) => s.seats);

  // Find the team subscription this user manages — for the demo we just take
  // the first TEAM_PRO sub, since the user is signed in as TEAM_ADMIN.
  const teamSub = useMemo(
    () => subs.find((s) => s.productId === "prod_team_pro" && s.status !== "CANCELED"),
    [subs],
  );

  if (!user || !teamSub) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="Team Pro · Seats"
          title="Seat Manager"
          subtitle="No active Team Pro subscription found for this account."
        />
      </AppShell>
    );
  }

  const teamSeats = seats.filter((s) => s.subscriptionId === teamSub.id);
  const price = findPrice(teamSub.priceId)!;
  const product = findProduct(teamSub.productId)!;
  const included = price.includedSeats ?? 20;
  const occupied = teamSeats.filter((s) => s.status === "ASSIGNED").length;
  const total = teamSeats.length;
  const overage = Math.max(0, total - included);
  const overageCost = overage * (price.perExtraUnitAmount ?? 0);
  const utilization = Math.round((occupied / Math.max(total, 1)) * 100);

  return (
    <AppShell>
      <PageHeader
        eyebrow={`${product.name} · ${teamSub.stripeSubscriptionId}`}
        title="Seat Manager"
        subtitle="Add or release seats. Each assigned athlete gets 50% off their Player Solo plan via the Team Pro link entitlement."
        actions={<AddSeatDialog subscriptionId={teamSub.id} />}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SeatStat
          icon={<Users className="w-4 h-4" />}
          label="Seats"
          value={`${total}`}
          sublabel={`${included} included · ${overage} extra`}
        />
        <SeatStat
          icon={<UserCheck className="w-4 h-4" />}
          label="Occupied"
          value={`${occupied}`}
          sublabel={`${utilization}% utilization`}
        />
        <SeatStat
          icon={<MinusCircle className="w-4 h-4" />}
          label="Vacant"
          value={`${total - occupied}`}
          sublabel="ready to invite"
        />
        <SeatStat
          icon={<Plus className="w-4 h-4 text-primary" />}
          label="Overage / cycle"
          value={formatCents(overageCost)}
          sublabel={`${formatCents(price.perExtraUnitAmount ?? 0)} per extra seat`}
          tone="primary"
        />
      </div>

      {/* Seat grid */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <header className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h3 className="font-display text-base uppercase tracking-tight">
            Roster ({total})
          </h3>
          <span className="text-[11.5px] text-muted-foreground font-mono">
            {included} base + {overage} overage
          </span>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          {teamSeats.length === 0 && (
            <div className="text-center py-12 col-span-full text-muted-foreground text-sm">
              No seats yet — start by inviting your first athletes.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {teamSeats.map((seat, idx) => (
            <div
              key={seat.id}
              className={`p-4 border-b border-r border-border ${
                idx >= included ? "bg-amber-500/5" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10.5px] text-muted-foreground">
                      Seat #{idx + 1}
                    </span>
                    {idx >= included && (
                      <Badge
                        variant="outline"
                        className="text-[9px] uppercase tracking-wider text-amber-400 border-amber-500/40"
                      >
                        Overage
                      </Badge>
                    )}
                  </div>
                  {seat.status === "ASSIGNED" ? (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/15 grid place-items-center text-primary text-[11px] font-bold">
                        {seat.occupantUserId?.split("_").pop()?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-[12.5px] font-medium">
                          Athlete {seat.occupantUserId?.split("_").pop()}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          COACH50 active
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-muted/40 grid place-items-center text-muted-foreground">
                        <UserPlus className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-[12.5px] font-medium text-muted-foreground">
                          Vacant seat
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Ready to invite
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {seat.status === "VACANT" && (
                    <InviteSeatDialog
                      onInvite={(uid) => {
                        swapSeat(seat.id, uid);
                        onRosterJoin(uid, {
                          kind: "TEAM_PRO",
                          teamId: teamSub.customerId,
                        });
                        toast.success(
                          `Athlete invited · COACH50 link granted to ${uid}`,
                        );
                      }}
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (seat.occupantUserId) {
                        onRosterRemove(seat.occupantUserId, {
                          kind: "TEAM_PRO",
                          teamId: teamSub.customerId,
                        });
                      }
                      removeSeat(seat.id);
                      toast.success("Seat released — link grandfathered to period end");
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */

function SeatStat({
  icon,
  label,
  value,
  sublabel,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
  tone?: "primary";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-1.5">
        {icon}
        {label}
      </div>
      <div className={`font-display text-2xl ${tone === "primary" ? "text-primary" : ""}`}>
        {value}
      </div>
      <div className="text-[11.5px] text-muted-foreground mt-0.5">{sublabel}</div>
    </div>
  );
}

function AddSeatDialog({ subscriptionId }: { subscriptionId: string }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(1);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add seats
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add seats</DialogTitle>
          <DialogDescription>
            Adds vacant seats to your Team Pro subscription. Stripe will
            invoice the prorated overage on the next cycle.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label className="text-[11px] uppercase tracking-wider font-mono">
            Quantity
          </Label>
          <NumericInput
            id="add-seat-quantity"
            value={count}
            onChange={setCount}
            min={1}
            max={20}
            className="mt-2 w-32"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              for (let i = 0; i < count; i++) addSeat(subscriptionId);
              toast.success(`${count} seat${count === 1 ? "" : "s"} added`);
              setOpen(false);
              setCount(1);
            }}
          >
            Add {count} seat{count === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InviteSeatDialog({
  onInvite,
}: {
  onInvite: (athleteUserId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Mail className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite an athlete to this seat</DialogTitle>
          <DialogDescription>
            They'll get 50% off Player Solo via the Team Pro link.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <Label className="text-[11px] uppercase tracking-wider font-mono">
            Email
          </Label>
          <Input
            type="email"
            placeholder="athlete@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!email}
            onClick={() => {
              const uid = `user_player_${email.split("@")[0]}`;
              onInvite(uid);
              setEmail("");
              setOpen(false);
            }}
          >
            Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
