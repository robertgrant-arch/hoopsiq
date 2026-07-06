import { useState } from "react";
import { Link, useRoute } from "wouter";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Film,
  Users,
  Share2,
  Trash2,
  GripVertical,
  CheckCircle2,
  Clock,
  Tag,
  MessageSquare,
  Send,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// ── Mock data ──────────────────────────────────────────────────────────────────

const PLAYLIST = {
  id: "pl1",
  title: "Contact Finishing — Teaching Reel",
  description:
    "Film clips showing contact finishing mistakes and corrections. Used for Monday practice film session.",
  purpose: "teaching" as const,
  createdBy: "Coach Williams",
  createdAt: "May 8, 2025",
  sharedWith: ["Varsity Roster"],
  clipCount: 6,
};

const CLIPS = [
  {
    id: "c1",
    order: 1,
    sessionTitle: "vs. Toms River · Apr 28",
    timestamp: "1:23",
    player: "Marcus Davis",
    initials: "MD",
    category: "finishing",
    note: "Fading on contact — missed and-1 opportunity. Watch the feet.",
    teachingNote:
      "Stop it here. See how the feet stop? That's the problem. Attack THROUGH contact.",
    type: "mistake" as const,
  },
  {
    id: "c2",
    order: 2,
    sessionTitle: "vs. Toms River · Apr 28",
    timestamp: "9:11",
    player: "Tyler Brown",
    initials: "TB",
    category: "finishing",
    note: "Euro step timing correct, weak-hand finish lost under contact.",
    teachingNote:
      "Good euro step. But look at the left hand — no commitment. That's the finish we need to build.",
    type: "mistake" as const,
  },
  {
    id: "c3",
    order: 3,
    sessionTitle: "vs. LBI · Apr 15",
    timestamp: "4:47",
    player: "Marcus Davis",
    initials: "MD",
    category: "finishing",
    note: "Strong left-hand contact finish — drew the foul AND scored.",
    teachingNote:
      "THIS is what we want. Same speed, same contact — but he went through it. Replay 3 times.",
    type: "positive" as const,
  },
  {
    id: "c4",
    order: 4,
    sessionTitle: "vs. LBI · Apr 15",
    timestamp: "7:22",
    player: "Jordan Smith",
    initials: "JS",
    category: "finishing",
    note: "Short floater off contact — went for the easy play instead of finishing strong.",
    teachingNote:
      "He had the angle but took the floater instead. Watch what the defense gives you — that's a layup.",
    type: "mistake" as const,
  },
  {
    id: "c5",
    order: 5,
    sessionTitle: "Practice · May 3",
    timestamp: "0:33",
    player: "Marcus Davis",
    initials: "MD",
    category: "finishing",
    note: "Mikan drill — showing improvement on left-hand consistency.",
    teachingNote:
      "Progress. Left hand is getting more confident in drills. Now bring it to game speed.",
    type: "positive" as const,
  },
  {
    id: "c6",
    order: 6,
    sessionTitle: "vs. Neptune · Mar 22",
    timestamp: "3:15",
    player: "Team",
    initials: "TM",
    category: "finishing",
    note: "Three straight missed contact finishes in final 90 seconds — game on the line.",
    teachingNote:
      "This is why we drill it. Games are decided in these moments. Be ready.",
    type: "mistake" as const,
  },
];

const DISCUSSION = [
  {
    id: "d1",
    author: "Coach Williams",
    text: "Pay attention to c1 and c2 — these are the exact habits we're drilling this week.",
    time: "May 8, 2:14 PM",
    isCoach: true,
  },
  {
    id: "d2",
    author: "Marcus Davis",
    text: "Got it. I see what you mean on the feet thing.",
    time: "May 8, 4:02 PM",
    isCoach: false,
  },
  {
    id: "d3",
    author: "Coach Williams",
    text: "Exactly. That's muscle memory now — we fix it in practice.",
    time: "May 8, 4:10 PM",
    isCoach: true,
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const PURPOSE_LABELS: Record<string, string> = {
  teaching: "Teaching Reel",
  scouting: "Scouting",
  highlights: "Highlights",
  recruiting: "Recruiting",
};

const PURPOSE_COLORS: Record<string, string> = {
  teaching: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  scouting: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  highlights: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  recruiting: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

function clipCategoryColor(category: string) {
  return "bg-orange-500";
}

// ── Page component ─────────────────────────────────────────────────────────────

export function FilmPlaylistPage() {
  useRoute("/app/coach/film/playlists/:id");

  const [activeClipIdx, setActiveClipIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(CLIPS[0].teachingNote);
  const [newMessage, setNewMessage] = useState("");

  const activeClip = CLIPS[activeClipIdx];
  const mistakeCount = CLIPS.filter((c) => c.type === "mistake").length;
  const positiveCount = CLIPS.filter((c) => c.type === "positive").length;

  function goToClip(idx: number) {
    if (idx < 0 || idx >= CLIPS.length) return;
    setActiveClipIdx(idx);
    setNoteText(CLIPS[idx].teachingNote);
    setEditingNote(false);
    setIsPlaying(false);
  }

  function handlePrev() {
    goToClip(activeClipIdx - 1);
  }

  function handleNext() {
    goToClip(activeClipIdx + 1);
  }

  function handlePlayPause() {
    setIsPlaying((p) => !p);
  }

  function handleSaveNote() {
    setEditingNote(false);
    toast.success("Teaching note saved");
  }

  function handleShare() {
    toast.success("Share link copied");
  }

  function handleSendMessage() {
    if (!newMessage.trim()) return;
    setNewMessage("");
    toast.success("Message sent");
  }

  return (
    <AppShell>
      <PageHeader
        title={PLAYLIST.title}
        subtitle={PLAYLIST.description}
        eyebrow="← Film Room"
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-6">
        {/* ── Left panel ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Video viewer */}
          <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
            {/* 16:9 mock video area */}
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                {/* Film grain overlay */}
                <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />

                {/* Clip counter */}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-black/60 text-slate-300 border-slate-700 text-xs font-mono">
                    Clip {activeClipIdx + 1} of {CLIPS.length}
                  </Badge>
                </div>

                {/* Type indicator */}
                <div className="absolute top-4 right-4">
                  {activeClip.type === "mistake" ? (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                      Mistake
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                      Positive
                    </Badge>
                  )}
                </div>

                {/* Center content */}
                <div className="flex flex-col items-center gap-3 text-center px-6">
                  <div className="w-16 h-16 rounded-full bg-slate-700/60 flex items-center justify-center">
                    {isPlaying ? (
                      <Pause className="w-7 h-7 text-white" />
                    ) : (
                      <Play className="w-7 h-7 text-white ml-1" />
                    )}
                  </div>
                  <p className="text-slate-400 text-sm font-medium">
                    {activeClip.sessionTitle}
                  </p>
                  <p className="text-slate-500 text-xs font-mono">
                    {activeClip.timestamp}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                      {activeClip.initials}
                    </div>
                    <span className="text-white text-sm font-medium">
                      {activeClip.player}
                    </span>
                    <Badge className="bg-slate-700 text-slate-300 border-slate-600 text-xs capitalize">
                      {activeClip.category}
                    </Badge>
                  </div>
                </div>

                {/* Clip note overlay */}
                <div className="absolute bottom-16 left-4 right-4">
                  <p className="text-slate-400 text-xs text-center leading-relaxed bg-black/40 rounded-lg px-3 py-2">
                    {activeClip.note}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="absolute bottom-10 left-4 right-4">
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all duration-300"
                      style={{ width: isPlaying ? "45%" : "0%" }}
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white h-7 w-7 p-0"
                    onClick={handlePrev}
                    disabled={activeClipIdx === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:text-orange-400 h-8 w-8 p-0"
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white h-7 w-7 p-0"
                    onClick={handleNext}
                    disabled={activeClipIdx === CLIPS.length - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Clip queue */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
              Clip Queue
            </p>
            <div className="flex flex-col gap-1.5">
              {CLIPS.map((clip, idx) => (
                <button
                  key={clip.id}
                  onClick={() => goToClip(idx)}
                  className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all flex items-center gap-3 group ${
                    idx === activeClipIdx
                      ? "bg-orange-500/10 border-orange-500/40 shadow-sm"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60"
                  }`}
                >
                  {/* Drag handle */}
                  <GripVertical className="w-4 h-4 text-slate-700 shrink-0 cursor-grab" />

                  {/* Order + avatar */}
                  <span className="text-xs font-mono text-slate-600 w-4 shrink-0">
                    {clip.order}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {clip.initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-medium truncate ${
                        idx === activeClipIdx ? "text-orange-300" : "text-slate-300"
                      }`}
                    >
                      {clip.player}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {clip.sessionTitle} · {clip.timestamp}
                    </p>
                  </div>

                  {/* Type dot */}
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      clip.type === "mistake" ? "bg-red-500" : "bg-emerald-500"
                    }`}
                  />

                  {/* Active indicator */}
                  {idx === activeClipIdx && (
                    <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right panel ────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Playlist header card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-white leading-tight">
                  {PLAYLIST.title}
                </h2>
              </div>
              <Badge
                className={`shrink-0 text-xs border ${PURPOSE_COLORS[PLAYLIST.purpose]}`}
              >
                {PURPOSE_LABELS[PLAYLIST.purpose]}
              </Badge>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {PLAYLIST.description}
            </p>

            {/* Shared with */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Shared with:</span>
                <span className="text-slate-300 font-medium">
                  {PLAYLIST.sharedWith.join(", ")}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-slate-400 hover:text-white"
                onClick={handleShare}
              >
                <Share2 className="w-3.5 h-3.5 mr-1" />
                <span className="text-xs">Share</span>
              </Button>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-3 text-xs text-slate-500 pt-1 border-t border-slate-800">
              <div className="flex items-center gap-1">
                <Film className="w-3 h-3" />
                <span>{PLAYLIST.clipCount} clips</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                <span>{mistakeCount} mistakes</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>{positiveCount} positives</span>
              </div>
            </div>

            {/* Created by */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              <span>
                Created by{" "}
                <span className="text-slate-400">{PLAYLIST.createdBy}</span> ·{" "}
                {PLAYLIST.createdAt}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 text-red-500/70 hover:text-red-400 hover:border-red-500/40 h-8 px-3"
                onClick={() => toast.error("Delete playlist?")}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Teaching note panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-semibold text-white">
                  Teaching Note — Clip {activeClipIdx + 1}
                </span>
              </div>
              {activeClip.type === "mistake" ? (
                <Badge className="bg-red-500/15 text-red-400 border-red-500/25 text-xs">
                  Mistake
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-xs">
                  Positive
                </Badge>
              )}
            </div>

            {editingNote ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-200 text-sm resize-none min-h-[100px] focus:border-orange-500/50"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white h-8 text-xs"
                    onClick={handleSaveNote}
                  >
                    Save Note
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-400 hover:text-white h-8 px-3 text-xs"
                    onClick={() => {
                      setNoteText(activeClip.teachingNote);
                      setEditingNote(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                className="w-full text-left group"
                onClick={() => setEditingNote(true)}
              >
                <p className="text-slate-200 text-sm leading-relaxed rounded-lg bg-slate-800/50 px-3 py-3 group-hover:bg-slate-800 transition-colors border border-transparent group-hover:border-slate-700">
                  {noteText}
                </p>
                <p className="text-xs text-slate-600 mt-1.5 group-hover:text-slate-500 transition-colors">
                  Click to edit
                </p>
              </button>
            )}
          </div>

          {/* Team discussion */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 flex-1">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-semibold text-white">Team Notes</span>
            </div>

            <div className="flex flex-col gap-3">
              {DISCUSSION.map((msg) => (
                <div key={msg.id} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        msg.isCoach ? "text-orange-400" : "text-blue-400"
                      }`}
                    >
                      {msg.author}
                    </span>
                    <span className="text-xs text-slate-600">{msg.time}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-800">
                    "{msg.text}"
                  </p>
                </div>
              ))}
            </div>

            {/* Message input */}
            <div className="flex gap-2 mt-auto pt-2 border-t border-slate-800">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Add a note..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 transition-colors"
              />
              <Button
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white h-8 w-8 p-0 shrink-0"
                onClick={handleSendMessage}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default FilmPlaylistPage;
