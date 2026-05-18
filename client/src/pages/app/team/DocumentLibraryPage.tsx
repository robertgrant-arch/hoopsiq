import { useState } from "react";
import {
  Search,
  Upload,
  FileText,
  Video,
  Image,
  Link as LinkIcon,
  File,
  Download,
  Share2,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";
import {
  teamDocuments,
  getDocumentAcknowledgmentRate,
  type TeamDocument,
} from "@/features/team-management/mock";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";

const CATEGORY_LABELS: Record<TeamDocument["category"], string> = {
  handbook:  "Handbook",
  waiver:    "Waiver",
  medical:   "Medical",
  policy:    "Policy",
  media:     "Media",
  resource:  "Resource",
  form:      "Form",
};

const CATEGORY_COLORS: Record<TeamDocument["category"], string> = {
  handbook:  "oklch(0.72 0.18 290)",
  waiver:    "oklch(0.68 0.22 25)",
  medical:   "oklch(0.78 0.16 75)",
  policy:    "oklch(0.72 0.18 240)",
  media:     "oklch(0.75 0.12 140)",
  resource:  "oklch(0.70 0.10 180)",
  form:      "oklch(0.72 0.18 320)",
};

const AUDIENCE_LABELS: Record<TeamDocument["targetAudience"], string> = {
  all:     "Everyone",
  coaches: "Coaches",
  parents: "Parents",
  players: "Players",
};

const SEASONS = ["All Seasons", "Spring 2026", "Fall 2025"];

type CategoryFilter = "all" | TeamDocument["category"];

// ─────────────────────────────────────────────────────────────────────────────
// File type icon
// ─────────────────────────────────────────────────────────────────────────────

function FileTypeIcon({
  fileType,
  className = "w-9 h-9",
}: {
  fileType: TeamDocument["fileType"];
  className?: string;
}) {
  const base = `${className} rounded-xl flex items-center justify-center shrink-0`;

  if (fileType === "pdf") {
    return (
      <div className={base} style={{ background: DANGER.replace(")", " / 0.12)"), color: DANGER }}>
        <FileText className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
      </div>
    );
  }
  if (fileType === "video") {
    return (
      <div className={base} style={{ background: SUCCESS.replace(")", " / 0.12)"), color: SUCCESS }}>
        <Video className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
      </div>
    );
  }
  if (fileType === "image") {
    return (
      <div className={base} style={{ background: WARNING.replace(")", " / 0.12)"), color: WARNING }}>
        <Image className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
      </div>
    );
  }
  if (fileType === "link") {
    return (
      <div className={base} style={{ background: PRIMARY.replace(")", " / 0.12)"), color: PRIMARY }}>
        <LinkIcon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
      </div>
    );
  }
  return (
    <div className={base} style={{ background: "oklch(0.22 0.005 260)", color: "oklch(0.55 0.01 260)" }}>
      <File style={{ width: 18, height: 18 }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Acknowledgment progress bar
// ─────────────────────────────────────────────────────────────────────────────

function AckProgress({ doc }: { doc: TeamDocument }) {
  const rate = getDocumentAcknowledgmentRate(doc);
  const color =
    rate >= 90 ? SUCCESS :
    rate >= 70 ? WARNING :
    DANGER;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-[11px] mb-1.5">
        <span className="text-muted-foreground">
          {doc.acknowledgmentCount} of {doc.totalRecipients} acknowledged
        </span>
        <span className="font-mono font-semibold" style={{ color }}>
          {rate}%
        </span>
      </div>
      <div
        className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ background: "oklch(0.22 0.005 260)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${rate}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Document card
// ─────────────────────────────────────────────────────────────────────────────

function DocumentCard({ doc }: { doc: TeamDocument }) {
  const catColor = CATEGORY_COLORS[doc.category];
  const uploadDate = new Date(doc.uploadedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/25 transition-colors"
      style={{ background: "oklch(0.15 0.005 260)" }}
    >
      {/* File type icon */}
      <FileTypeIcon fileType={doc.fileType} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <span className="text-[14px] font-semibold leading-snug">{doc.title}</span>
        </div>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {/* Category badge */}
          <span
            className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
            style={{
              background: catColor.replace(")", " / 0.12)"),
              color: catColor,
            }}
          >
            {CATEGORY_LABELS[doc.category]}
          </span>

          {/* Audience badge */}
          <span
            className="px-2 py-0.5 rounded-full text-[10.5px] font-medium border"
            style={{
              borderColor: "oklch(0.28 0.005 260)",
              color: "oklch(0.60 0.02 260)",
            }}
          >
            {AUDIENCE_LABELS[doc.targetAudience]}
          </span>

          {/* Season */}
          {doc.season && (
            <span className="text-[11px] text-muted-foreground">
              {doc.season}
            </span>
          )}

          {/* File size */}
          {doc.fileSize && (
            <span className="text-[11px] text-muted-foreground">{doc.fileSize}</span>
          )}
        </div>

        <div className="text-[11.5px] text-muted-foreground mt-1">
          Uploaded by {doc.uploadedBy} · {uploadDate}
        </div>

        {/* Acknowledgment progress */}
        {doc.requiresAcknowledgment && (
          <AckProgress doc={doc} />
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5 shrink-0">
        <button
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium border border-border hover:border-primary/40 hover:text-primary transition-colors whitespace-nowrap"
          onClick={() => toast.info(`Opening ${doc.title}`)}
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </button>
        {doc.fileType !== "link" && (
          <button
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium border border-border hover:border-border/80 transition-colors whitespace-nowrap"
            onClick={() => toast.success(`Downloading ${doc.title}…`)}
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        )}
        <button
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium border border-border hover:border-border/80 transition-colors whitespace-nowrap"
          onClick={() => toast.success(`Share link copied for ${doc.title}`)}
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Needs attention section
// ─────────────────────────────────────────────────────────────────────────────

function NeedsAttentionSection({ docs }: { docs: TeamDocument[] }) {
  if (docs.length === 0) return null;

  return (
    <div
      className="rounded-xl border overflow-hidden mb-6"
      style={{
        borderColor: WARNING.replace(")", " / 0.35)"),
        background: WARNING.replace(")", " / 0.05)"),
      }}
    >
      <div
        className="flex items-center gap-2.5 px-5 py-3.5 border-b"
        style={{ borderBottomColor: WARNING.replace(")", " / 0.20)") }}
      >
        <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: WARNING }} />
        <span className="text-[13.5px] font-bold" style={{ color: WARNING }}>
          Needs Attention — {docs.length} document{docs.length !== 1 ? "s" : ""} below 80% acknowledgment
        </span>
      </div>
      <div className="p-4 space-y-3">
        {docs.map((doc) => {
          const rate = getDocumentAcknowledgmentRate(doc);
          return (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background"
            >
              <FileTypeIcon fileType={doc.fileType} className="w-8 h-8" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate">{doc.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.22 0.005 260)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${rate}%`, background: rate < 50 ? DANGER : WARNING }}
                    />
                  </div>
                  <span className="text-[11px] font-mono" style={{ color: rate < 50 ? DANGER : WARNING }}>
                    {rate}% · {doc.acknowledgmentCount}/{doc.totalRecipients}
                  </span>
                </div>
              </div>
              <button
                className="h-8 px-3 rounded-lg text-[12px] font-semibold text-white shrink-0 transition-all hover:brightness-110"
                style={{ background: WARNING }}
                onClick={() => toast.success(`Reminder sent for "${doc.title}"`)}
              >
                Send Reminder
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export function DocumentLibraryPage() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [seasonFilter, setSeasonFilter]     = useState("All Seasons");
  const [search, setSearch]                 = useState("");

  const categories: { key: CategoryFilter; label: string }[] = [
    { key: "all",      label: "All" },
    { key: "handbook", label: "Handbooks" },
    { key: "waiver",   label: "Waivers" },
    { key: "medical",  label: "Medical" },
    { key: "policy",   label: "Policy" },
    { key: "media",    label: "Media" },
    { key: "resource", label: "Resources" },
    { key: "form",     label: "Forms" },
  ];

  // Needs attention: requires acknowledgment AND below 80%
  const needsAttention = teamDocuments.filter(
    (d) => d.requiresAcknowledgment && getDocumentAcknowledgmentRate(d) < 80
  );

  // Apply all filters
  const filtered = teamDocuments.filter((doc) => {
    const matchCat    = categoryFilter === "all" || doc.category === categoryFilter;
    const matchSeason = seasonFilter === "All Seasons" || doc.season === seasonFilter;
    const matchSearch = search === "" ||
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(search.toLowerCase()) ||
      doc.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSeason && matchSearch;
  });

  // Summary stats
  const totalDocs       = teamDocuments.length;
  const requiresAckDocs = teamDocuments.filter((d) => d.requiresAcknowledgment);
  const fullyAcked      = requiresAckDocs.filter((d) => getDocumentAcknowledgmentRate(d) === 100).length;

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="TEAM MANAGEMENT"
          title="Document Library"
          subtitle="Handbooks, waivers, policies, and shared resources"
          actions={
            <button
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-semibold text-white transition-all hover:brightness-110"
              style={{ background: PRIMARY }}
              onClick={() => toast.info("Upload feature coming soon")}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload
            </button>
          }
        />

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Documents", value: totalDocs.toString(),            color: PRIMARY  },
            { label: "Require Sign-off", value: requiresAckDocs.length.toString(), color: WARNING  },
            { label: "Fully Acknowledged", value: fullyAcked.toString(),        color: SUCCESS  },
            { label: "Need Attention",    value: needsAttention.length.toString(), color: needsAttention.length > 0 ? DANGER : SUCCESS },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border p-4"
              style={{ background: "oklch(0.15 0.005 260)" }}
            >
              <div className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground font-semibold mb-1">
                {stat.label}
              </div>
              <div className="font-mono text-[22px] font-bold" style={{ color: stat.color }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Needs attention */}
        <NeedsAttentionSection docs={needsAttention} />

        {/* Category tabs */}
        <div className="flex border-b border-border mb-4 overflow-x-auto">
          {categories.map(({ key, label }) => {
            const count = key === "all"
              ? teamDocuments.length
              : teamDocuments.filter((d) => d.category === key).length;
            return (
              <button
                key={key}
                onClick={() => setCategoryFilter(key)}
                className="px-4 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-colors"
                style={
                  categoryFilter === key
                    ? { borderBottomColor: PRIMARY, color: PRIMARY, fontWeight: 600 }
                    : { borderBottomColor: "transparent", color: "oklch(0.55 0.02 260)" }
                }
              >
                {label}
                <span className="ml-1.5 font-mono text-[10px] opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Search + season filter */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-[360px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents…"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              className="h-9 pl-3 pr-7 rounded-lg border border-border bg-background text-[12.5px] focus:outline-none focus:border-primary/50 transition-colors"
            >
              {SEASONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <span className="text-[11.5px] text-muted-foreground ml-auto">
            {filtered.length} document{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Document list */}
        {filtered.length === 0 ? (
          <div
            className="rounded-xl border border-border py-16 text-center"
            style={{ background: "oklch(0.15 0.005 260)" }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: "oklch(0.20 0.005 260)" }}
            >
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-[14px] font-semibold mb-1">No documents found</p>
            <p className="text-[12.5px] text-muted-foreground">
              {search ? `No results for "${search}"` : "No documents in this category yet"}
            </p>
            <button
              className="mt-4 flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-semibold text-white mx-auto transition-all hover:brightness-110"
              style={{ background: PRIMARY }}
              onClick={() => toast.info("Upload feature coming soon")}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload First Document
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Group by category when "all" is selected for better UX */}
            {categoryFilter === "all" ? (
              <>
                {(["handbook", "waiver", "medical", "policy", "form", "resource", "media"] as TeamDocument["category"][]).map(
                  (cat) => {
                    const catDocs = filtered.filter((d) => d.category === cat);
                    if (catDocs.length === 0) return null;
                    const catColor = CATEGORY_COLORS[cat];
                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-2 mb-2 mt-5 first:mt-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: catColor }}
                          />
                          <h3
                            className="text-[11.5px] uppercase tracking-[0.1em] font-bold"
                            style={{ color: catColor }}
                          >
                            {CATEGORY_LABELS[cat]}
                          </h3>
                          <span className="text-[10.5px] text-muted-foreground font-mono">
                            {catDocs.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {catDocs.map((doc) => (
                            <DocumentCard key={doc.id} doc={doc} />
                          ))}
                        </div>
                      </div>
                    );
                  }
                )}
              </>
            ) : (
              filtered.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))
            )}
          </div>
        )}

        {/* All-signed call-out */}
        {filtered.length > 0 &&
          filtered.every(
            (d) => !d.requiresAcknowledgment || getDocumentAcknowledgmentRate(d) === 100
          ) && (
          <div
            className="flex items-center gap-3 mt-6 p-4 rounded-xl border"
            style={{
              borderColor: SUCCESS.replace(")", " / 0.30)"),
              background: SUCCESS.replace(")", " / 0.06)"),
            }}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: SUCCESS }} />
            <span className="text-[13px] font-medium" style={{ color: SUCCESS }}>
              All documents in this view are fully acknowledged — great work!
            </span>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default DocumentLibraryPage;
