/**
 * TeamMessagingPage — /app/team/messaging
 *
 * Role-aware team communication hub with channels, subgroup messaging,
 * direct messages, and announcement management.
 */
import { useState, useRef, useEffect } from "react";
import {
  Hash,
  Send,
  Megaphone,
  Users,
  Lock,
  ChevronDown,
  ChevronRight,
  X,
  AlertCircle,
  Clock,
  Check,
  CheckCheck,
  MessageSquare,
  Plus,
  Bell,
  BellOff,
  MoreHorizontal,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type ChannelType = "announcement" | "group" | "staff" | "direct";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  body: string;
  timestamp: string;
  readCount?: number;
  totalMembers?: number;
  unreadList?: string[];
}

interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  description: string;
  memberCount: number;
  unread?: number;
  messages: Message[];
  /** For direct messages — the other party's name */
  dmWith?: string;
  dmInitials?: string;
}

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const CHANNELS: Channel[] = [
  /* ── ANNOUNCEMENTS ──────────────────────────────────────────────────────── */
  {
    id: "all-team",
    name: "all-team",
    type: "announcement",
    description: "Program-wide announcements for all players, parents, and staff.",
    memberCount: 42,
    unread: 2,
    messages: [
      {
        id: "m1",
        senderId: "coach1",
        senderName: "Coach Marcus Webb",
        senderInitials: "MW",
        body: "🏀 REMINDER: Spring Invitational is this Saturday at Oak Ridge Sports Complex. Bus departs the facility at 6:45 AM sharp. Please have your player there by 6:30. Uniforms are home whites. Bring both pairs of shoes.",
        timestamp: "Today, 8:14 AM",
        readCount: 31,
        totalMembers: 42,
        unreadList: ["DeShawn Morris", "Tyler Brooks", "Noah Rivera", "Kwame Johnson", "Isaiah Peters", "Carlos Ruiz", "Dante Williams", "Brandon Okafor", "Malik Thompson", "Jerome Casey", "Xavier Hill"],
      },
      {
        id: "m2",
        senderId: "admin1",
        senderName: "Director Alicia Reyes",
        senderInitials: "AR",
        body: "Registration for the summer league is now open! Early bird pricing ends May 31st. All families should complete the online form AND the updated photo consent by end of this week. Link is in the parent portal.",
        timestamp: "Yesterday, 3:52 PM",
        readCount: 38,
        totalMembers: 42,
        unreadList: ["Carlos Ruiz", "Dante Williams", "Brandon Okafor", "Jerome Casey"],
      },
      {
        id: "m3",
        senderId: "coach1",
        senderName: "Coach Marcus Webb",
        senderInitials: "MW",
        body: "Practice tomorrow (Wednesday) is MOVED to 5:30 PM instead of 4:30 PM due to a school event at the gym. We will still go full 2 hours. Please share with your families.",
        timestamp: "Mon, 6:30 PM",
        readCount: 42,
        totalMembers: 42,
        unreadList: [],
      },
      {
        id: "m4",
        senderId: "admin1",
        senderName: "Director Alicia Reyes",
        senderInitials: "AR",
        body: "Huge shoutout to the 17U squad for their 3–1 record at the Eastside Tournament last weekend! Special recognition to Tyler Brooks for back-to-back double-doubles. This team is buying in. Keep it going!",
        timestamp: "Sun, 9:07 AM",
        readCount: 42,
        totalMembers: 42,
        unreadList: [],
      },
      {
        id: "m5",
        senderId: "coach2",
        senderName: "Coach Deja Simmons",
        senderInitials: "DS",
        body: "For all 15U families: the code of conduct forms are still missing from 6 players. This must be completed before Saturday. Please check your email for the link — reach out to me directly if you have trouble.",
        timestamp: "Fri, 11:15 AM",
        readCount: 40,
        totalMembers: 42,
        unreadList: ["Noah Rivera", "Kwame Johnson"],
      },
    ],
  },
  {
    id: "parents-only",
    name: "parents-only",
    type: "announcement",
    description: "Parent-facing updates: logistics, volunteering, billing reminders.",
    memberCount: 28,
    messages: [
      {
        id: "p1",
        senderId: "admin1",
        senderName: "Director Alicia Reyes",
        senderInitials: "AR",
        body: "Parent volunteer sign-ups for the Spring Invitational concession stand are live! We need 8 volunteers on Saturday. Please grab a slot — every family is asked to help at least once per season.",
        timestamp: "Today, 10:30 AM",
        readCount: 22,
        totalMembers: 28,
        unreadList: ["Jennifer Brooks", "Maria Rivera", "Sandra Morris"],
      },
      {
        id: "p2",
        senderId: "admin1",
        senderName: "Director Alicia Reyes",
        senderInitials: "AR",
        body: "Monthly tuition payment of $175 is due June 1st. Autopay families — no action needed. If you pay manually, the portal is the fastest option. Late fees apply after the 5th.",
        timestamp: "Yesterday, 9:00 AM",
        readCount: 28,
        totalMembers: 28,
        unreadList: [],
      },
      {
        id: "p3",
        senderId: "coach1",
        senderName: "Coach Marcus Webb",
        senderInitials: "MW",
        body: "A note on snacks: please no sugary drinks in the gym bags. Water and sports drinks are fine. We're noticing some players hitting energy walls mid-practice. Help us set them up for success!",
        timestamp: "Mon, 2:00 PM",
        readCount: 25,
        totalMembers: 28,
        unreadList: ["David Kim", "Patricia Johnson", "Angela Okafor"],
      },
    ],
  },
  /* ── GROUPS ─────────────────────────────────────────────────────────────── */
  {
    id: "guards",
    name: "guards",
    type: "group",
    description: "Point guards and shooting guards. Skill work, film, and assignments.",
    memberCount: 11,
    unread: 3,
    messages: [
      {
        id: "g1",
        senderId: "coach1",
        senderName: "Coach Marcus Webb",
        senderInitials: "MW",
        body: "Guards — watch the clip I uploaded of Friday's late-clock possession. We're telegraphing the pick-and-roll too early. I want everyone to jot down two things you notice before Thursday's practice. We'll discuss as a group.",
        timestamp: "Today, 9:45 AM",
      },
      {
        id: "g2",
        senderId: "player1",
        senderName: "DeShawn Morris",
        senderInitials: "DM",
        body: "Watched it twice. I think the issue is I'm reading the help defense too late off the screen. Also noticed my shoulders were giving the pass away before I made it.",
        timestamp: "Today, 10:22 AM",
      },
      {
        id: "g3",
        senderId: "player2",
        senderName: "Tyler Brooks",
        senderInitials: "TB",
        body: "Good eye DM. Coach I think we need more time on the chin series — when I go chin to either side the defense is reacting before I've made a read.",
        timestamp: "Today, 10:51 AM",
      },
      {
        id: "g4",
        senderId: "coach1",
        senderName: "Coach Marcus Webb",
        senderInitials: "MW",
        body: "Great analysis from both of you. That's exactly the level of film work I want. We'll build Thursday's practice around the chin series and late-clock reads. Get some good rest tonight.",
        timestamp: "Today, 11:00 AM",
      },
    ],
  },
  {
    id: "bigs",
    name: "bigs",
    type: "group",
    description: "Centers and power forwards. Post play, screens, and rim protection.",
    memberCount: 9,
    messages: [
      {
        id: "b1",
        senderId: "coach2",
        senderName: "Coach Deja Simmons",
        senderInitials: "DS",
        body: "Bigs — I'm adding a 15-minute post footwork block to every practice this week. Come ready to work on the drop step and the up-and-under. This is where we're leaving points on the floor.",
        timestamp: "Yesterday, 4:10 PM",
      },
      {
        id: "b2",
        senderId: "player3",
        senderName: "Kwame Johnson",
        senderInitials: "KJ",
        body: "Coach can we also work on the seal on the block? I'm getting fronted too often in games and losing position.",
        timestamp: "Yesterday, 4:45 PM",
      },
      {
        id: "b3",
        senderId: "coach2",
        senderName: "Coach Deja Simmons",
        senderInitials: "DS",
        body: "Yes Kwame, absolutely. We'll add the seal + duck-in to Wednesday's plan. Good awareness of what's hurting you — that's exactly the growth mindset we need.",
        timestamp: "Yesterday, 5:00 PM",
      },
    ],
  },
  {
    id: "wings",
    name: "wings",
    type: "group",
    description: "Small forwards and wings. Versatility, defensive rotations, and transition.",
    memberCount: 10,
    messages: [
      {
        id: "w1",
        senderId: "coach1",
        senderName: "Coach Marcus Webb",
        senderInitials: "MW",
        body: "Wings — your defensive close-outs on Saturday were a problem all game. We're giving up open threes on the kick-out because we're ball-watching. I want everyone to go through the close-out drill series in the drill library before Thursday.",
        timestamp: "Mon, 7:00 PM",
      },
      {
        id: "w2",
        senderId: "player4",
        senderName: "Noah Rivera",
        senderInitials: "NR",
        body: "Done, coach. I also rewatched the film — I think I'm overplaying the drive on the left side and leaving the corner wide open. Is that what you're seeing?",
        timestamp: "Mon, 8:12 PM",
      },
      {
        id: "w3",
        senderId: "coach1",
        senderName: "Coach Marcus Webb",
        senderInitials: "MW",
        body: "Exactly right Noah. Left side drive is your tendancy — once they know it they'll use it as a setup for the kick-out. We'll work on it Thursday. Good film study.",
        timestamp: "Mon, 8:20 PM",
      },
    ],
  },
  {
    id: "17u",
    name: "17u",
    type: "group",
    description: "17U team channel for roster-wide communication.",
    memberCount: 14,
    messages: [
      {
        id: "17u1",
        senderId: "coach1",
        senderName: "Coach Marcus Webb",
        senderInitials: "MW",
        body: "17U squad — great energy at practice today. I could feel the difference in focus after our talk last week. Saturday's opponent likes to press in the 4th quarter. We'll spend Friday's practice on press-break sets. Be sharp.",
        timestamp: "Today, 6:15 PM",
      },
      {
        id: "17u2",
        senderId: "player1",
        senderName: "DeShawn Morris",
        senderInitials: "DM",
        body: "Let's go! Can't wait for Saturday. Team looking locked in 🔒",
        timestamp: "Today, 6:30 PM",
      },
    ],
  },
  {
    id: "15u",
    name: "15u",
    type: "group",
    description: "15U team channel for roster-wide communication.",
    memberCount: 13,
    messages: [
      {
        id: "15u1",
        senderId: "coach2",
        senderName: "Coach Deja Simmons",
        senderInitials: "DS",
        body: "15U — heads up that I've uploaded three new drill videos to your assignments. These are mandatory to watch before Monday. The footwork concepts we've been building toward are all in there.",
        timestamp: "Yesterday, 5:30 PM",
      },
    ],
  },
  /* ── STAFF ───────────────────────────────────────────────────────────────── */
  {
    id: "coaches-only",
    name: "coaches-only",
    type: "staff",
    description: "Internal coaching staff channel. Strategy, player notes, and scheduling.",
    memberCount: 5,
    messages: [
      {
        id: "co1",
        senderId: "coach1",
        senderName: "Coach Marcus Webb",
        senderInitials: "MW",
        body: "Quick heads up — Tyler Brooks came to me after practice seeming a bit down. I don't think it's a confidence issue but keep an eye on him this week. His at-risk flag has been yellow for 10 days.",
        timestamp: "Today, 7:30 PM",
      },
      {
        id: "co2",
        senderId: "coach2",
        senderName: "Coach Deja Simmons",
        senderInitials: "DS",
        body: "I noticed too. His effort in drills was there but something is off. I'll check in with him before Thursday's practice — he responds well to one-on-ones.",
        timestamp: "Today, 7:45 PM",
      },
      {
        id: "co3",
        senderId: "coach3",
        senderName: "Coach Ray Torres",
        senderInitials: "RT",
        body: "Also want to flag: DeShawn has missed two straight film sessions. His IDP is due for a check-in. Can one of us set that up this week?",
        timestamp: "Today, 8:00 PM",
      },
    ],
  },
  {
    id: "director-staff",
    name: "director-staff",
    type: "staff",
    description: "Director and admin coordination: registrations, billing, scheduling.",
    memberCount: 3,
    messages: [
      {
        id: "ds1",
        senderId: "admin1",
        senderName: "Director Alicia Reyes",
        senderInitials: "AR",
        body: "The Spring Invitational venue contract is signed. I'll need Marcus to confirm the travel roster by Wednesday at noon for the bus company. 24 players confirmed so far.",
        timestamp: "Yesterday, 2:00 PM",
      },
    ],
  },
];

const DM_CHANNELS: Channel[] = [
  {
    id: "dm-jennifer",
    name: "Jennifer Brooks",
    type: "direct",
    description: "Parent of Tyler Brooks (17U)",
    memberCount: 2,
    dmWith: "Jennifer Brooks",
    dmInitials: "JB",
    messages: [
      {
        id: "dm1a",
        senderId: "parent1",
        senderName: "Jennifer Brooks",
        senderInitials: "JB",
        body: "Hi Coach Webb — Tyler mentioned Saturday's game might have changed locations? Do you have the confirmed address? I need to arrange carpooling with two other families.",
        timestamp: "Today, 2:15 PM",
      },
      {
        id: "dm1b",
        senderId: "coach1",
        senderName: "Coach Marcus Webb",
        senderInitials: "MW",
        body: "Hi Jennifer! Yes, it's confirmed at Oak Ridge Sports Complex — 1200 Oak Ridge Drive, Gymnasium B. Parking is free in Lot C. We tip off at 9:00 AM. Let me know if you need anything else!",
        timestamp: "Today, 2:28 PM",
      },
      {
        id: "dm1c",
        senderId: "parent1",
        senderName: "Jennifer Brooks",
        senderInitials: "JB",
        body: "Perfect, thank you! Also — Tyler has been working extra hard this week. Whatever you said to him really clicked. He's been shooting in the driveway until dark every night. 😊",
        timestamp: "Today, 2:35 PM",
      },
    ],
  },
  {
    id: "dm-ray",
    name: "Coach Ray Torres",
    type: "direct",
    description: "Assistant Coach — 15U",
    memberCount: 2,
    dmWith: "Coach Ray Torres",
    dmInitials: "RT",
    messages: [
      {
        id: "dm2a",
        senderId: "coach1",
        senderName: "Coach Marcus Webb",
        senderInitials: "MW",
        body: "Ray — for Thursday's practice, can you run the pick-and-roll defense station? I want the guards to get at least 30 reps of the hedge-and-recover. I'll take the live 5-on-5.",
        timestamp: "Yesterday, 6:00 PM",
      },
      {
        id: "dm2b",
        senderId: "coach3",
        senderName: "Coach Ray Torres",
        senderInitials: "RT",
        body: "On it. Should I film the station for film review or just coach it live?",
        timestamp: "Yesterday, 6:10 PM",
      },
      {
        id: "dm2c",
        senderId: "coach1",
        senderName: "Coach Marcus Webb",
        senderInitials: "MW",
        body: "Film it please — especially the first 10 minutes when habits tend to break down. We can use it for the Friday film session.",
        timestamp: "Yesterday, 6:15 PM",
      },
    ],
  },
  {
    id: "dm-maria",
    name: "Maria Rivera",
    type: "direct",
    description: "Parent of Noah Rivera (Wings)",
    memberCount: 2,
    dmWith: "Maria Rivera",
    dmInitials: "MR",
    messages: [
      {
        id: "dm3a",
        senderId: "parent2",
        senderName: "Maria Rivera",
        senderInitials: "MR",
        body: "Coach Webb, I wanted to let you know Noah will be out Wednesday — he has a school science fair presentation he has to attend. He's really upset about missing practice.",
        timestamp: "Mon, 8:00 AM",
      },
      {
        id: "dm3b",
        senderId: "coach1",
        senderName: "Coach Marcus Webb",
        senderInitials: "MW",
        body: "Thanks for the heads-up Maria, school always comes first! Tell Noah I expect a full science fair debrief at Thursday's practice 😄 I'll mark him excused and send him the practice notes.",
        timestamp: "Mon, 9:30 AM",
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const CHANNEL_GROUP_LABELS: Record<string, string> = {
  announcement: "ANNOUNCEMENTS",
  group: "GROUPS",
  staff: "STAFF",
};

function channelTypeBadgeStyle(type: ChannelType): React.CSSProperties {
  switch (type) {
    case "announcement":
      return { background: "oklch(0.72 0.18 290 / 0.12)", color: "oklch(0.72 0.18 290)", border: "1px solid oklch(0.72 0.18 290 / 0.25)" };
    case "group":
      return { background: "oklch(0.75 0.12 140 / 0.12)", color: "oklch(0.75 0.12 140)", border: "1px solid oklch(0.75 0.12 140 / 0.25)" };
    case "staff":
      return { background: "oklch(0.78 0.16 75 / 0.12)", color: "oklch(0.78 0.16 75)", border: "1px solid oklch(0.78 0.16 75 / 0.25)" };
    case "direct":
      return { background: "oklch(0.65 0.02 260 / 0.10)", color: "oklch(0.65 0.02 260)", border: "1px solid oklch(0.65 0.02 260 / 0.20)" };
  }
}

function channelTypeLabel(type: ChannelType) {
  switch (type) {
    case "announcement": return "Announcement";
    case "group":        return "Group";
    case "staff":        return "Staff";
    case "direct":       return "Direct";
  }
}

function channelIcon(type: ChannelType, size = "w-3.5 h-3.5") {
  switch (type) {
    case "announcement": return <Megaphone className={size} />;
    case "staff":        return <Lock className={size} />;
    case "direct":       return <MessageSquare className={size} />;
    default:             return <Hash className={size} />;
  }
}

/* -------------------------------------------------------------------------- */
/* ChannelSidebar                                                              */
/* -------------------------------------------------------------------------- */

function ChannelSidebar({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleSection(key: string) {
    setCollapsed((p) => ({ ...p, [key]: !p[key] }));
  }

  const grouped: { label: string; key: string; channels: Channel[] }[] = [
    { label: "ANNOUNCEMENTS", key: "announcement", channels: CHANNELS.filter((c) => c.type === "announcement") },
    { label: "GROUPS",        key: "group",        channels: CHANNELS.filter((c) => c.type === "group") },
    { label: "STAFF",         key: "staff",        channels: CHANNELS.filter((c) => c.type === "staff") },
    { label: "DIRECT",        key: "direct",       channels: DM_CHANNELS },
  ];

  return (
    <aside className="w-64 border-r border-border flex flex-col h-full shrink-0 bg-background overflow-y-auto">
      <div className="h-14 border-b border-border flex items-center px-4 shrink-0">
        <MessageSquare className="w-4 h-4 mr-2 text-muted-foreground" />
        <span className="font-semibold text-[14px]">Team Messaging</span>
      </div>

      <div className="py-2">
        {grouped.map(({ label, key, channels }) => (
          <div key={key} className="mb-1">
            <button
              onClick={() => toggleSection(key)}
              className="w-full flex items-center justify-between px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <span>{label}</span>
              {collapsed[key] ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {!collapsed[key] && channels.map((ch) => {
              const active = ch.id === selectedId;
              return (
                <button
                  key={ch.id}
                  onClick={() => onSelect(ch.id)}
                  className="w-full flex items-center justify-between px-4 py-2 text-[13px] transition-colors text-left group"
                  style={
                    active
                      ? { background: "oklch(0.72 0.18 290 / 0.10)", color: "oklch(0.72 0.18 290)" }
                      : { color: "oklch(0.60 0.02 260)" }
                  }
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 opacity-60">
                      {ch.type === "direct" ? (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                          style={{ background: "oklch(0.72 0.18 290 / 0.15)", color: "oklch(0.72 0.18 290)" }}
                        >
                          {ch.dmInitials?.slice(0, 1)}
                        </div>
                      ) : (
                        channelIcon(ch.type, "w-3.5 h-3.5")
                      )}
                    </span>
                    <span className={`truncate ${active ? "font-semibold" : ""}`}>
                      {ch.type === "direct" ? ch.dmWith : ch.name}
                    </span>
                  </span>
                  {ch.unread && ch.unread > 0 ? (
                    <span
                      className="ml-2 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ background: "oklch(0.68 0.22 25)" }}
                    >
                      {ch.unread}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}

/* -------------------------------------------------------------------------- */
/* MessageBubble                                                               */
/* -------------------------------------------------------------------------- */

function MessageBubble({
  msg,
  isAnnouncement,
}: {
  msg: Message;
  isAnnouncement: boolean;
}) {
  const [showUnread, setShowUnread] = useState(false);

  return (
    <div className="flex gap-3 py-3 group">
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
        style={{ background: "oklch(0.72 0.18 290 / 0.15)", color: "oklch(0.72 0.18 290)" }}
      >
        {msg.senderInitials}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[13px] font-semibold">{msg.senderName}</span>
          <span className="text-[11px] text-muted-foreground">{msg.timestamp}</span>
        </div>

        {/* Body */}
        <p className="text-[13.5px] leading-relaxed text-foreground whitespace-pre-wrap">{msg.body}</p>

        {/* Read receipts for announcements */}
        {isAnnouncement && msg.readCount !== undefined && msg.totalMembers !== undefined && (
          <div className="mt-2">
            <button
              onClick={() => setShowUnread((p) => !p)}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {msg.readCount === msg.totalMembers ? (
                <CheckCheck className="w-3.5 h-3.5" style={{ color: "oklch(0.75 0.12 140)" }} />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>
                Read by{" "}
                <span className={msg.readCount === msg.totalMembers ? "" : "font-semibold"} style={{ color: msg.readCount === msg.totalMembers ? "oklch(0.75 0.12 140)" : "oklch(0.68 0.22 25)" }}>
                  {msg.readCount} of {msg.totalMembers}
                </span>{" "}
                members
              </span>
              {msg.unreadList && msg.unreadList.length > 0 && (
                <ChevronDown className={`w-3 h-3 transition-transform ${showUnread ? "rotate-180" : ""}`} />
              )}
            </button>

            {showUnread && msg.unreadList && msg.unreadList.length > 0 && (
              <div className="mt-2 p-2.5 rounded-lg bg-muted/50 border border-border">
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Unread by:</p>
                <div className="flex flex-wrap gap-1">
                  {msg.unreadList.map((name) => (
                    <span key={name} className="text-[11px] bg-background border border-border px-2 py-0.5 rounded-full">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* AnnouncementComposerModal                                                   */
/* -------------------------------------------------------------------------- */

function AnnouncementComposerModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "players" | "parents" | "coaches">("all");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");
  const [scheduled, setScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [preview, setPreview] = useState(false);

  const audienceOptions: { value: "all" | "players" | "parents" | "coaches"; label: string }[] = [
    { value: "all",     label: "All Members" },
    { value: "players", label: "Players Only" },
    { value: "parents", label: "Parents Only" },
    { value: "coaches", label: "Coaches Only" },
  ];

  function handlePost() {
    if (!title.trim() || !body.trim()) {
      toast.error("Please fill in title and message.");
      return;
    }
    toast.success("Announcement published", {
      description: scheduled && scheduleDate
        ? `Scheduled for ${scheduleDate}`
        : `Sent to ${audienceOptions.find((a) => a.value === audience)?.label}`,
    });
    onClose();
    setTitle("");
    setBody("");
    setAudience("all");
    setPriority("normal");
    setScheduled(false);
    setScheduleDate("");
    setPreview(false);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-4 h-4" style={{ color: "oklch(0.72 0.18 290)" }} />
            New Announcement
          </DialogTitle>
        </DialogHeader>

        {preview ? (
          <div className="space-y-4">
            {/* Preview card */}
            <div className="rounded-xl border border-border p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {priority === "urgent" && (
                    <AlertCircle className="w-4 h-4" style={{ color: "oklch(0.68 0.22 25)" }} />
                  )}
                  <span className="font-bold text-[15px]">{title || "(No title)"}</span>
                </div>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: "oklch(0.72 0.18 290 / 0.12)", color: "oklch(0.72 0.18 290)" }}
                >
                  {audienceOptions.find((a) => a.value === audience)?.label}
                </span>
              </div>
              <p className="text-[13px] text-muted-foreground whitespace-pre-wrap">{body || "(No message body)"}</p>
              <p className="text-[11px] text-muted-foreground">— Coach Marcus Webb · Now</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setPreview(false)}>Edit</Button>
              <Button size="sm" onClick={handlePost} style={{ background: "oklch(0.72 0.18 290)", color: "white" }}>
                Post Announcement
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-[12px] font-medium block mb-1">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Spring Invitational reminder"
                className="text-[13px]"
              />
            </div>

            <div>
              <label className="text-[12px] font-medium block mb-1">Message</label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your announcement here..."
                className="text-[13px] min-h-[100px] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-medium block mb-1">Audience</label>
                <div className="flex flex-col gap-1">
                  {audienceOptions.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={audience === opt.value}
                        onChange={() => setAudience(opt.value)}
                        className="accent-primary"
                      />
                      <span className="text-[12px]">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium block mb-1">Priority</label>
                <div className="flex gap-2">
                  {(["normal", "urgent"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className="flex-1 py-1.5 rounded-lg text-[12px] font-medium border transition-all capitalize"
                      style={
                        priority === p
                          ? p === "urgent"
                            ? { background: "oklch(0.68 0.22 25 / 0.12)", color: "oklch(0.68 0.22 25)", borderColor: "oklch(0.68 0.22 25 / 0.30)" }
                            : { background: "oklch(0.72 0.18 290 / 0.10)", color: "oklch(0.72 0.18 290)", borderColor: "oklch(0.72 0.18 290 / 0.25)" }
                          : { borderColor: "oklch(0.20 0.01 260)" }
                      }
                    >
                      {p === "urgent" && priority === "urgent" && <AlertCircle className="w-3 h-3 inline mr-1" />}
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Schedule send */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduled}
                  onChange={(e) => setScheduled(e.target.checked)}
                  className="accent-primary"
                />
                <span className="text-[12px] font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Schedule send
                </span>
              </label>
              {scheduled && (
                <Input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="mt-2 text-[12px]"
                />
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreview(true)}
                disabled={!title.trim() || !body.trim()}
              >
                Preview
              </Button>
              <Button
                size="sm"
                onClick={handlePost}
                disabled={!title.trim() || !body.trim()}
                style={{ background: "oklch(0.72 0.18 290)", color: "white" }}
              >
                Post
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* ChannelPanel                                                                */
/* -------------------------------------------------------------------------- */

function ChannelPanel({ channel }: { channel: Channel }) {
  const [draft, setDraft] = useState("");
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAnnouncement = channel.type === "announcement";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [channel.id]);

  function handleSend() {
    if (!draft.trim()) return;
    toast.success("Message sent");
    setDraft("");
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full">
      {/* Channel header */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 text-muted-foreground">
            {channel.type === "direct" ? (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold"
                style={{ background: "oklch(0.72 0.18 290 / 0.15)", color: "oklch(0.72 0.18 290)" }}
              >
                {channel.dmInitials}
              </div>
            ) : (
              channelIcon(channel.type, "w-4 h-4")
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[14px]">
                {channel.type === "direct" ? channel.dmWith : `#${channel.name}`}
              </span>
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full hidden sm:inline-flex"
                style={channelTypeBadgeStyle(channel.type)}
              >
                {channelTypeLabel(channel.type)}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate hidden sm:block">
              {channel.description}
              {channel.type !== "direct" && ` · ${channel.memberCount} members`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAnnouncement && (
            <Button
              size="sm"
              onClick={() => setAnnouncementOpen(true)}
              className="text-[12px] gap-1.5"
              style={{ background: "oklch(0.72 0.18 290)", color: "white" }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Announcement</span>
            </Button>
          )}
          <button className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg transition-colors">
            <BellOff className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <div className="divide-y divide-border/50">
          {channel.messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} isAnnouncement={isAnnouncement} />
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-border p-3 shrink-0">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                isAnnouncement
                  ? "Use the 'New Announcement' button for formatted posts..."
                  : `Message ${channel.type === "direct" ? channel.dmWith : `#${channel.name}`}`
              }
              className="resize-none text-[13px] min-h-[44px] max-h-[120px] pr-10"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!draft.trim()}
            className="w-9 h-9 flex items-center justify-center rounded-lg shrink-0 transition-all disabled:opacity-40"
            style={{
              background: draft.trim() ? "oklch(0.72 0.18 290)" : "oklch(0.72 0.18 290 / 0.20)",
              color: "white",
            }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/50 mt-1.5 ml-1">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>

      <AnnouncementComposerModal open={announcementOpen} onClose={() => setAnnouncementOpen(false)} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TeamMessagingPage                                                           */
/* -------------------------------------------------------------------------- */

export default function TeamMessagingPage() {
  const allChannels = [...CHANNELS, ...DM_CHANNELS];
  const [selectedId, setSelectedId] = useState("all-team");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const selectedChannel = allChannels.find((c) => c.id === selectedId) ?? allChannels[0];

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-56px)] lg:h-screen overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex">
          <ChannelSidebar selectedId={selectedId} onSelect={setSelectedId} />
        </div>

        {/* Mobile sidebar drawer */}
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="p-0 w-72">
            <SheetHeader className="sr-only">
              <SheetTitle>Channels</SheetTitle>
            </SheetHeader>
            <ChannelSidebar
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                setMobileSidebarOpen(false);
              }}
            />
          </SheetContent>
        </Sheet>

        {/* Main panel */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Mobile top bar with channel picker */}
          <div className="lg:hidden h-12 border-b border-border flex items-center px-3 gap-2 shrink-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Hash className="w-4 h-4" />
              <span>{selectedChannel.type === "direct" ? selectedChannel.dmWith : selectedChannel.name}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {selectedChannel && <ChannelPanel channel={selectedChannel} />}
        </div>
      </div>
    </AppShell>
  );
}
