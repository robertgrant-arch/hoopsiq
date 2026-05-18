import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  MapPin,
  Clock,
  Calendar,
  Sun,
  Car,
  CheckSquare,
  Square,
  ChevronRight,
  Phone,
  User,
  Navigation,
  Trophy,
  Dumbbell,
  Star,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Film,
  Pencil,
  ParkingSquare,
  ExternalLink,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ── Color tokens ───────────────────────────────────────────────────────────────

const PRIMARY  = "oklch(0.72 0.18 290)";
const SUCCESS  = "oklch(0.75 0.12 140)";
const WARNING  = "oklch(0.78 0.16 75)";
const DANGER   = "oklch(0.68 0.22 25)";

// ── Types ──────────────────────────────────────────────────────────────────────

type EventType = "practice" | "game" | "tournament";
type RSVPStatus = "going" | "cant" | "maybe" | null;
type GearItem = { id: string; label: string; checked: boolean };

type CarpoolOffer = {
  id: string;
  name: string;
  initials: string;
  spots: number;
  pickup: string;
  contact: string;
};

type CarpoolRequest = {
  id: string;
  name: string;
  initials: string;
  neighborhood: string;
};

type MockEvent = {
  id: string;
  type: EventType;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  arriveTime: string;
  location: string;
  address: string;
  mapsUrl: string;
  isOutdoor: boolean;
  weather: string | null;
  opponent: string | null;
  rsvpDeadline: string;
  rsvpCounts: { going: number; cant: number; noResponse: number };
  players: { id: string; name: string; initials: string; rsvp: RSVPStatus }[];
  coachNotes: string;
  venueNotes: string;
  parking: string;
  coachName: string;
  coachPhone: string;
  carpoolOffers: CarpoolOffer[];
  carpoolRequests: CarpoolRequest[];
  isCompleted: boolean;
  attendance: Record<string, "present" | "absent" | "late"> | null;
  tournamentBracketUrl: string | null;
  filmUrl: string | null;
  gearList: GearItem[];
};

// ── Mock events ────────────────────────────────────────────────────────────────

const MOCK_EVENTS: Record<string, MockEvent> = {
  "1": {
    id: "1",
    type: "practice",
    title: "Tuesday Practice",
    date: "Tuesday, May 19, 2026",
    startTime: "3:30 PM",
    endTime: "5:30 PM",
    arriveTime: "3:15 PM",
    location: "Barnegat HS Main Gym",
    address: "175 Barnegat Blvd, Barnegat, NJ 08005",
    mapsUrl: "https://maps.google.com/?q=175+Barnegat+Blvd+Barnegat+NJ",
    isOutdoor: false,
    weather: null,
    opponent: null,
    rsvpDeadline: "Monday, May 18 · 8:00 PM",
    rsvpCounts: { going: 9, cant: 1, noResponse: 2 },
    coachNotes:
      "Full-court 5-on-5 scrimmage for the final 30 minutes. Players arriving late should warm up on their own and check in with Coach Martinez. Bring your ankle braces — we'll be doing lateral defensive drills.",
    venueNotes: "Enter through the side door on Oak St. Main entrance is locked after 3 PM.",
    parking: "Free parking in Lot C behind the gym.",
    coachName: "Coach Williams",
    coachPhone: "(609) 555-0142",
    carpoolOffers: [
      { id: "co1", name: "James Davis", initials: "JD", spots: 3, pickup: "Barnegat Park & Ride", contact: "(609) 555-0191" },
      { id: "co2", name: "Linda Smith", initials: "LS", spots: 2, pickup: "Shore Mall Parking Lot", contact: "(732) 555-0247" },
    ],
    carpoolRequests: [
      { id: "cr1", name: "Malik Thompson", initials: "MT", neighborhood: "Manahawkin area" },
    ],
    isCompleted: false,
    attendance: null,
    tournamentBracketUrl: null,
    filmUrl: null,
    gearList: [
      { id: "g1", label: "Basketball sneakers", checked: false },
      { id: "g2", label: "Water bottle (filled)", checked: false },
      { id: "g3", label: "Personal ball", checked: false },
      { id: "g4", label: "Change of clothes", checked: false },
      { id: "g5", label: "Athletic tape / ankle brace", checked: false },
    ],
    players: [
      { id: "p1",  name: "Marcus Davis",   initials: "MD", rsvp: "going"  },
      { id: "p2",  name: "Jordan Smith",   initials: "JS", rsvp: "going"  },
      { id: "p3",  name: "Tyler Brown",    initials: "TB", rsvp: "going"  },
      { id: "p4",  name: "Devon Williams", initials: "DW", rsvp: "going"  },
      { id: "p5",  name: "Caleb Moore",    initials: "CM", rsvp: "going"  },
      { id: "p6",  name: "Isaiah Jones",   initials: "IJ", rsvp: "going"  },
      { id: "p7",  name: "Nathan Reed",    initials: "NR", rsvp: "cant"   },
      { id: "p8",  name: "Chris Evans",    initials: "CE", rsvp: "going"  },
      { id: "p9",  name: "Malik Thompson", initials: "MT", rsvp: "maybe"  },
      { id: "p10", name: "Dante Garcia",   initials: "DG", rsvp: "going"  },
      { id: "p11", name: "Zion Patterson", initials: "ZP", rsvp: null     },
      { id: "p12", name: "Aiden Cruz",     initials: "AC", rsvp: null     },
    ],
  },

  "2": {
    id: "2",
    type: "game",
    title: "@ Toms River North",
    date: "Friday, May 23, 2026",
    startTime: "7:00 PM",
    endTime: "9:00 PM",
    arriveTime: "6:15 PM",
    location: "Toms River North High School",
    address: "1225 Old Freehold Rd, Toms River, NJ 08753",
    mapsUrl: "https://maps.google.com/?q=1225+Old+Freehold+Rd+Toms+River+NJ",
    isOutdoor: false,
    weather: null,
    opponent: "Toms River North Mariners",
    rsvpDeadline: "Thursday, May 22 · 12:00 PM",
    rsvpCounts: { going: 10, cant: 0, noResponse: 2 },
    coachNotes:
      "Away game — wear full warm-up suits getting off the bus. We will run our zone sets from Tuesday. Focus on communication on the defensive end. Senior night for TRN so expect a rowdy crowd. Stay composed.",
    venueNotes: "Visiting team enters through the Gym B entrance on the west side. Locker room is down the hall on the left.",
    parking: "Visitor parking in the main lot off Old Freehold Rd. Arrive early — it fills fast.",
    coachName: "Coach Williams",
    coachPhone: "(609) 555-0142",
    carpoolOffers: [
      { id: "co1", name: "James Davis", initials: "JD", spots: 4, pickup: "Barnegat Park & Ride (Rt 9)", contact: "(609) 555-0191" },
      { id: "co2", name: "Tonya Williams", initials: "TW", spots: 2, pickup: "Wawa on Rt 9 South", contact: "(609) 555-0318" },
    ],
    carpoolRequests: [
      { id: "cr1", name: "Aiden Cruz", initials: "AC", neighborhood: "Staffordville" },
    ],
    isCompleted: false,
    attendance: null,
    tournamentBracketUrl: null,
    filmUrl: null,
    gearList: [
      { id: "g1", label: "Home & away uniform (both)", checked: false },
      { id: "g2", label: "Basketball sneakers", checked: false },
      { id: "g3", label: "Water bottle", checked: false },
      { id: "g4", label: "Ankle brace / support", checked: false },
      { id: "g5", label: "Warm-up suit", checked: false },
      { id: "g6", label: "Pre-game snack", checked: false },
      { id: "g7", label: "Headphones (optional)", checked: false },
    ],
    players: [
      { id: "p1",  name: "Marcus Davis",   initials: "MD", rsvp: "going"  },
      { id: "p2",  name: "Jordan Smith",   initials: "JS", rsvp: "going"  },
      { id: "p3",  name: "Tyler Brown",    initials: "TB", rsvp: "going"  },
      { id: "p4",  name: "Devon Williams", initials: "DW", rsvp: "going"  },
      { id: "p5",  name: "Caleb Moore",    initials: "CM", rsvp: "going"  },
      { id: "p6",  name: "Isaiah Jones",   initials: "IJ", rsvp: "going"  },
      { id: "p7",  name: "Nathan Reed",    initials: "NR", rsvp: "going"  },
      { id: "p8",  name: "Chris Evans",    initials: "CE", rsvp: "going"  },
      { id: "p9",  name: "Malik Thompson", initials: "MT", rsvp: "going"  },
      { id: "p10", name: "Dante Garcia",   initials: "DG", rsvp: "going"  },
      { id: "p11", name: "Zion Patterson", initials: "ZP", rsvp: null     },
      { id: "p12", name: "Aiden Cruz",     initials: "AC", rsvp: null     },
    ],
  },

  "3": {
    id: "3",
    type: "tournament",
    title: "Spring Invitational 2026 — Day 1",
    date: "Saturday, May 23, 2026",
    startTime: "9:00 AM",
    endTime: "6:00 PM",
    arriveTime: "8:00 AM",
    location: "Prudential Center — Court B",
    address: "25 Lafayette St, Newark, NJ 07102",
    mapsUrl: "https://maps.google.com/?q=25+Lafayette+St+Newark+NJ",
    isOutdoor: false,
    weather: null,
    opponent: "Multiple opponents (pool play)",
    rsvpDeadline: "Wednesday, May 20 · 8:00 PM",
    rsvpCounts: { going: 12, cant: 0, noResponse: 0 },
    coachNotes:
      "Full roster traveling. We play 3 pool-play games on Saturday. Rest between games — stay hydrated and off your feet. All players meet in lobby at 8:00 AM sharp. Bus departs at 8:15 AM. No late arrivals.",
    venueNotes:
      "Tournament courts are on Level 1. Enter through Gate A. Our team check-in table is at the east entrance. Spectators use Gate B.",
    parking: "Parking garage at 45 Edison Pl — $15 flat rate. Get there early.",
    coachName: "Coach Williams",
    coachPhone: "(609) 555-0142",
    carpoolOffers: [
      { id: "co1", name: "James Davis",  initials: "JD", spots: 5, pickup: "Barnegat Park & Ride",   contact: "(609) 555-0191" },
      { id: "co2", name: "Rosa Garcia",  initials: "RG", spots: 3, pickup: "ShopRite Lot on Rt 72",  contact: "(609) 555-0422" },
    ],
    carpoolRequests: [],
    isCompleted: false,
    attendance: null,
    tournamentBracketUrl: "/app/team/tournament/spring26",
    filmUrl: null,
    gearList: [
      { id: "g1",  label: "Home uniform",                   checked: false },
      { id: "g2",  label: "Away uniform",                   checked: false },
      { id: "g3",  label: "Warm-up suit (top & bottom)",    checked: false },
      { id: "g4",  label: "Basketball sneakers (game pair)",checked: false },
      { id: "g5",  label: "Practice sneakers (backup)",     checked: false },
      { id: "g6",  label: "Water bottle (min 32 oz)",       checked: false },
      { id: "g7",  label: "Sports drinks / electrolytes",   checked: false },
      { id: "g8",  label: "Pre-game & halftime snacks",     checked: false },
      { id: "g9",  label: "Ankle braces / wraps",           checked: false },
      { id: "g10", label: "Foam roller / recovery band",    checked: false },
      { id: "g11", label: "Headphones",                     checked: false },
      { id: "g12", label: "Phone charger & battery pack",   checked: false },
      { id: "g13", label: "Change of clothes",              checked: false },
      { id: "g14", label: "Cash / meal money ($25)",        checked: false },
    ],
    players: [
      { id: "p1",  name: "Marcus Davis",   initials: "MD", rsvp: "going" },
      { id: "p2",  name: "Jordan Smith",   initials: "JS", rsvp: "going" },
      { id: "p3",  name: "Tyler Brown",    initials: "TB", rsvp: "going" },
      { id: "p4",  name: "Devon Williams", initials: "DW", rsvp: "going" },
      { id: "p5",  name: "Caleb Moore",    initials: "CM", rsvp: "going" },
      { id: "p6",  name: "Isaiah Jones",   initials: "IJ", rsvp: "going" },
      { id: "p7",  name: "Nathan Reed",    initials: "NR", rsvp: "going" },
      { id: "p8",  name: "Chris Evans",    initials: "CE", rsvp: "going" },
      { id: "p9",  name: "Malik Thompson", initials: "MT", rsvp: "going" },
      { id: "p10", name: "Dante Garcia",   initials: "DG", rsvp: "going" },
      { id: "p11", name: "Zion Patterson", initials: "ZP", rsvp: "going" },
      { id: "p12", name: "Aiden Cruz",     initials: "AC", rsvp: "going" },
    ],
  },
};

function getFallbackEvent(): MockEvent {
  return MOCK_EVENTS["1"];
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function EventTypeBadge({ type }: { type: EventType }) {
  const configs: Record<EventType, { label: string; icon: React.ReactNode; bg: string; color: string }> = {
    practice:   { label: "Practice",   icon: <Dumbbell className="w-3 h-3" />,  bg: `${SUCCESS.replace(")", " / 0.12)")}`,  color: SUCCESS  },
    game:       { label: "Game",       icon: <Star className="w-3 h-3" />,      bg: `${PRIMARY.replace(")", " / 0.12)")}`,  color: PRIMARY  },
    tournament: { label: "Tournament", icon: <Trophy className="w-3 h-3" />,    bg: `${WARNING.replace(")", " / 0.15)")}`,  color: WARNING  },
  };
  const cfg = configs[type];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function Avatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-[11px]";
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-semibold shrink-0`}
      style={{ background: `${PRIMARY.replace(")", " / 0.12)")}`, color: PRIMARY }}
    >
      {initials}
    </div>
  );
}

function RSVPIcon({ status }: { status: RSVPStatus }) {
  if (status === "going")
    return <CheckCircle2 className="w-4 h-4" style={{ color: SUCCESS }} />;
  if (status === "cant")
    return <XCircle className="w-4 h-4" style={{ color: DANGER }} />;
  if (status === "maybe")
    return <AlertCircle className="w-4 h-4" style={{ color: WARNING }} />;
  return <span className="w-4 h-4 rounded-full border-2 border-border inline-block" />;
}

function RSVPLabel({ status }: { status: RSVPStatus }) {
  if (status === "going")  return <span className="text-[12px] font-medium" style={{ color: SUCCESS }}>Going</span>;
  if (status === "cant")   return <span className="text-[12px] font-medium" style={{ color: DANGER }}>Can't make it</span>;
  if (status === "maybe")  return <span className="text-[12px] font-medium" style={{ color: WARNING }}>Maybe</span>;
  return <span className="text-[12px] text-muted-foreground">No response</span>;
}

// ── Offer a Ride mini-form ─────────────────────────────────────────────────────

function OfferRideForm({ onClose }: { onClose: () => void }) {
  const [spots, setSpots] = useState("2");
  const [pickup, setPickup] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pickup.trim()) {
      toast.error("Please enter a pickup location.");
      return;
    }
    toast.success("Ride offer posted! Other families can now contact you.");
    onClose();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-border rounded-xl p-4 bg-card flex flex-col gap-3 mt-3"
    >
      <div className="text-[13px] font-semibold">Offer a Ride</div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
          Seats available
        </label>
        <select
          value={spots}
          onChange={(e) => setSpots(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-[13px] bg-background"
        >
          {["1", "2", "3", "4", "5"].map((n) => (
            <option key={n} value={n}>{n} seat{n !== "1" ? "s" : ""}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
          Pickup location
        </label>
        <input
          type="text"
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
          placeholder="e.g. Barnegat Park & Ride"
          className="border border-border rounded-lg px-3 py-2 text-[13px] bg-background placeholder:text-muted-foreground/50"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1" style={{ background: PRIMARY }}>
          Post Offer
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const event = MOCK_EVENTS[id ?? ""] ?? getFallbackEvent();

  const [myRSVP, setMyRSVP] = useState<RSVPStatus>(null);
  const [gear, setGear] = useState<GearItem[]>(event.gearList);
  const [notesOpen, setNotesOpen] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);

  function handleRSVP(status: RSVPStatus) {
    setMyRSVP(status);
    const labels: Record<NonNullable<RSVPStatus>, string> = {
      going: "You're confirmed as going!",
      cant:  "Response saved — coach has been notified.",
      maybe: "Response saved as maybe.",
    };
    if (status) toast.success(labels[status]);
  }

  function toggleGear(itemId: string) {
    setGear((prev) =>
      prev.map((g) => (g.id === itemId ? { ...g, checked: !g.checked } : g))
    );
  }

  const checkedCount = gear.filter((g) => g.checked).length;

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <PageHeader
          eyebrow="Team · Events"
          title={event.title}
          subtitle={`${event.date} · ${event.startTime} – ${event.endTime}`}
          actions={
            <Link href="/app/team/calendar">
              <a>
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-1.5" />
                  Calendar
                </Button>
              </a>
            </Link>
          }
        />

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT / MAIN COLUMN ── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* 1. Event header card */}
            <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <EventTypeBadge type={event.type} />
                  <h2 className="text-xl font-bold leading-tight">{event.title}</h2>
                </div>
                {event.isOutdoor && event.weather && (
                  <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 shrink-0">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span className="text-[12px] font-medium text-amber-700 dark:text-amber-400">{event.weather}</span>
                  </div>
                )}
              </div>

              {/* Date / time row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-2.5 bg-muted/40 rounded-xl p-3">
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-0.5">
                      Schedule
                    </div>
                    <div className="text-[13px] font-medium">
                      Arrive: <span style={{ color: WARNING }}>{event.arriveTime}</span>
                      <span className="text-muted-foreground mx-1.5">|</span>
                      Start: <span style={{ color: PRIMARY }}>{event.startTime}</span>
                    </div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">
                      Ends approx. {event.endTime}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-muted/40 rounded-xl p-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-0.5">
                      Location
                    </div>
                    <div className="text-[13px] font-medium truncate">{event.location}</div>
                    <div className="text-[12px] text-muted-foreground truncate">{event.address}</div>
                    <a
                      href={event.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1.5 text-[12px] font-medium"
                      style={{ color: PRIMARY }}
                    >
                      <Navigation className="w-3 h-3" />
                      Get Directions
                    </a>
                  </div>
                </div>
              </div>

              {/* Outdoor weather strip */}
              {event.isOutdoor && (
                <div className="flex items-center gap-2 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 rounded-xl px-4 py-2.5">
                  <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="text-[13px]">
                    <span className="font-semibold text-amber-700 dark:text-amber-300">Weather: </span>
                    <span className="text-amber-600 dark:text-amber-400">{event.weather ?? "72°F, Clear"}</span>
                    <span className="text-muted-foreground ml-2 text-[12px]">Outdoor event — dress accordingly</span>
                  </div>
                </div>
              )}

              {/* Opponent */}
              {event.opponent && (
                <div className="flex items-center gap-3 border border-border rounded-xl px-4 py-3 bg-muted/20">
                  <Trophy className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                      Opponent
                    </div>
                    <div className="text-[14px] font-semibold">{event.opponent}</div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. RSVP section */}
            <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold">RSVP</h3>
                <span className="text-[12px] text-muted-foreground">
                  Deadline: {event.rsvpDeadline}
                </span>
              </div>

              {/* Counts */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Going",       count: event.rsvpCounts.going,      color: SUCCESS },
                  { label: "Can't Make It", count: event.rsvpCounts.cant,     color: DANGER  },
                  { label: "No Response", count: event.rsvpCounts.noResponse, color: "oklch(0.55 0.02 260)" },
                ].map(({ label, count, color }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center justify-center rounded-xl py-3 border border-border bg-muted/30"
                  >
                    <span className="text-2xl font-bold" style={{ color }}>{count}</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">{label}</span>
                  </div>
                ))}
              </div>

              {/* My RSVP buttons */}
              <div className="flex flex-col gap-2">
                <div className="text-[12px] text-muted-foreground font-medium uppercase tracking-wide">
                  Your response
                </div>
                <div className="flex items-center gap-2">
                  {(["going", "cant", "maybe"] as const).map((status) => {
                    const labels = { going: "Going", cant: "Can't Make It", maybe: "Maybe" };
                    const colors: Record<string, string> = { going: SUCCESS, cant: DANGER, maybe: WARNING };
                    const isActive = myRSVP === status;
                    return (
                      <button
                        key={status}
                        onClick={() => handleRSVP(status)}
                        className="flex-1 py-2 rounded-xl border text-[13px] font-medium transition-all"
                        style={
                          isActive
                            ? {
                                background: `${colors[status].replace(")", " / 0.14)")}`,
                                borderColor: `${colors[status].replace(")", " / 0.40)")}`,
                                color: colors[status],
                              }
                            : { borderColor: "var(--border)", color: "var(--muted-foreground)" }
                        }
                      >
                        {labels[status]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Player RSVP list */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/40 border-b border-border text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Player Responses
                </div>
                <div className="divide-y divide-border">
                  {event.players.map((player) => (
                    <div key={player.id} className="flex items-center gap-3 px-4 py-2.5">
                      <Avatar initials={player.initials} size="sm" />
                      <span className="flex-1 text-[13px] font-medium">{player.name}</span>
                      <div className="flex items-center gap-1.5">
                        <RSVPIcon status={player.rsvp} />
                        <RSVPLabel status={player.rsvp} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Gear checklist */}
            <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold">Gear Checklist</h3>
                <span className="text-[12px] text-muted-foreground">
                  {checkedCount} / {gear.length} packed
                </span>
              </div>
              {checkedCount === gear.length && gear.length > 0 && (
                <div
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium"
                  style={{ background: `${SUCCESS.replace(")", " / 0.10)")}`, color: SUCCESS }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  All packed and ready!
                </div>
              )}
              <div className="flex flex-col gap-1">
                {gear.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleGear(item.id)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors text-left"
                  >
                    {item.checked ? (
                      <CheckSquare className="w-4 h-4 shrink-0" style={{ color: SUCCESS }} />
                    ) : (
                      <Square className="w-4 h-4 shrink-0 text-muted-foreground/50" />
                    )}
                    <span
                      className={`text-[13px] ${
                        item.checked ? "line-through text-muted-foreground/60" : "text-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Coach Notes */}
            <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold">Coach's Notes</h3>
                <button
                  onClick={() => setNotesOpen(!notesOpen)}
                  className="text-[12px] flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </button>
              </div>
              {event.coachNotes ? (
                <p className="text-[13.5px] text-foreground/80 leading-relaxed">{event.coachNotes}</p>
              ) : (
                <div className="text-[13px] text-muted-foreground/60 italic py-4 text-center border border-dashed border-border rounded-xl">
                  No notes added yet.
                </div>
              )}
              {notesOpen && (
                <div className="flex flex-col gap-2 pt-1">
                  <textarea
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-[13px] bg-background resize-none min-h-[80px]"
                    placeholder="Add notes for the team..."
                    defaultValue={event.coachNotes}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      style={{ background: PRIMARY }}
                      onClick={() => { toast.success("Notes saved."); setNotesOpen(false); }}
                    >
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setNotesOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT / SIDEBAR COLUMN ── */}
          <div className="flex flex-col gap-5">

            {/* 5. Carpool Board */}
            <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4" style={{ color: PRIMARY }} />
                <h3 className="text-[15px] font-semibold">Carpool Board</h3>
              </div>

              {/* Offers */}
              <div className="flex flex-col gap-2">
                <div className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">
                  Offering a Ride
                </div>
                {event.carpoolOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="border border-border rounded-xl p-3 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar initials={offer.initials} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold">{offer.name}</div>
                        <div className="text-[11px] text-muted-foreground">{offer.spots} seats available</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {offer.pickup}
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                      <Phone className="w-3 h-3 shrink-0" />
                      {offer.contact}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-1"
                      onClick={() => toast.success(`Request sent to ${offer.name}!`)}
                    >
                      Join Carpool
                    </Button>
                  </div>
                ))}
              </div>

              {/* Requests */}
              {event.carpoolRequests.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">
                    Need a Ride
                  </div>
                  {event.carpoolRequests.map((req) => (
                    <div
                      key={req.id}
                      className="border border-dashed border-border rounded-xl p-3 flex items-center gap-2"
                    >
                      <Avatar initials={req.initials} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium">{req.name}</div>
                        <div className="text-[11px] text-muted-foreground">{req.neighborhood}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full text-[13px]"
                  onClick={() => setShowOfferForm((p) => !p)}
                >
                  <Car className="w-3.5 h-3.5 mr-1.5" />
                  Offer a Ride
                </Button>
                {showOfferForm && (
                  <OfferRideForm onClose={() => setShowOfferForm(false)} />
                )}
              </div>
            </div>

            {/* 6. Logistics panel */}
            <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
              <h3 className="text-[15px] font-semibold">Logistics</h3>

              {/* Coach contact */}
              <div className="flex flex-col gap-2">
                <div className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">
                  Day-of Contact
                </div>
                <div className="flex items-center gap-3 bg-muted/40 rounded-xl p-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{ background: `${PRIMARY.replace(")", " / 0.12)")}`, color: PRIMARY }}
                  >
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold">{event.coachName}</div>
                    <a
                      href={`tel:${event.coachPhone}`}
                      className="text-[12px]"
                      style={{ color: PRIMARY }}
                    >
                      {event.coachPhone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Venue notes */}
              <div className="flex flex-col gap-1.5">
                <div className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">
                  Venue Notes
                </div>
                <p className="text-[13px] text-foreground/80 leading-relaxed">{event.venueNotes}</p>
              </div>

              {/* Parking */}
              <div className="flex items-start gap-2 text-[13px] border border-border rounded-xl px-3 py-2.5 bg-muted/20">
                <ParkingSquare className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                <span className="text-foreground/80">{event.parking}</span>
              </div>

              {/* Tournament bracket link */}
              {event.tournamentBracketUrl && (
                <Link href={event.tournamentBracketUrl} asChild>
                  <a className="flex items-center gap-2 text-[13px] font-medium py-2 border-t border-border pt-4" style={{ color: PRIMARY }}>
                    <Trophy className="w-4 h-4" />
                    View Tournament Bracket
                    <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                  </a>
                </Link>
              )}

              {/* Film link */}
              {event.filmUrl && (
                <a
                  href={event.filmUrl}
                  className="flex items-center gap-2 text-[13px] font-medium border-t border-border pt-4"
                  style={{ color: PRIMARY }}
                >
                  <Film className="w-4 h-4" />
                  Watch Game Film
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
              )}
            </div>

            {/* 7. Attendance (past events) */}
            {event.isCompleted && event.attendance && (
              <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
                <h3 className="text-[15px] font-semibold">Attendance</h3>
                <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                  {event.players.map((player) => {
                    const status = event.attendance?.[player.id];
                    const statusConfig = {
                      present: { label: "Present", color: SUCCESS },
                      absent:  { label: "Absent",  color: DANGER  },
                      late:    { label: "Late",     color: WARNING },
                    } as const;
                    const cfg = status ? statusConfig[status as keyof typeof statusConfig] : null;
                    return (
                      <div key={player.id} className="flex items-center gap-3 px-4 py-2.5">
                        <Avatar initials={player.initials} size="sm" />
                        <span className="flex-1 text-[13px] font-medium">{player.name}</span>
                        {cfg ? (
                          <span className="text-[12px] font-medium" style={{ color: cfg.color }}>
                            {cfg.label}
                          </span>
                        ) : (
                          <span className="text-[12px] text-muted-foreground">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => toast.success("Attendance updated.")}
                >
                  Edit Attendance
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default EventDetailPage;
