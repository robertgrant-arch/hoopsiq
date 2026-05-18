/**
 * RosterImportPage — /app/coach/program/roster-import
 *
 * 3-step CSV import flow:
 *   Step 1: Source selection (CSV paste / CSV file stub / manual add)
 *   Step 2: Paste textarea pre-filled with SAMPLE_CSV → parse → preview table
 *   Step 3: Confirm → success state with imported player count
 */

import React, { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  ClipboardPaste,
  FileSpreadsheet,
  UserPlus,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Upload,
  RotateCcw,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import {
  SAMPLE_CSV,
  parseRosterCsv,
  type ImportedPlayer,
  type ImportSource,
} from "@/lib/mock/program-ops";

/* ─── Types ──────────────────────────────────────────────────────────────────── */

type ImportStep = "source" | "preview" | "confirm";

/* ─── Colour tokens ──────────────────────────────────────────────────────────── */

const PRIMARY  = "oklch(0.72 0.18 290)";
const SUCCESS  = "oklch(0.75 0.12 140)";
const WARNING  = "oklch(0.78 0.16 75)";
const DANGER   = "oklch(0.68 0.22 25)";
const MUTED    = "oklch(0.55 0.02 260)";

/* ─── Source option card ─────────────────────────────────────────────────────── */

interface SourceOptionProps {
  icon: React.ReactElement;
  title: string;
  description: string;
  badge?: string;
  onClick: () => void;
  disabled?: boolean;
}

function SourceOption({
  icon,
  title,
  description,
  badge,
  onClick,
  disabled = false,
}: SourceOptionProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left flex items-center gap-4 rounded-xl border p-4 transition-all"
      style={{
        borderColor: disabled ? "oklch(0.30 0.01 260)" : "oklch(0.28 0.015 260)",
        background: disabled ? "oklch(0.14 0.01 260)" : "oklch(0.16 0.015 260)",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = PRIMARY;
          (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.18 0.015 260)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "oklch(0.28 0.015 260)";
          (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.16 0.015 260)";
        }
      }}
    >
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${PRIMARY}20` }}
      >
        {React.cloneElement(icon as React.ReactElement<{ className?: string; style?: React.CSSProperties }>, { className: "w-5 h-5", style: { color: PRIMARY } })}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold" style={{ color: "oklch(0.93 0.01 260)" }}>
            {title}
          </span>
          {badge && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
              style={{ background: `${WARNING}25`, color: WARNING }}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>
          {description}
        </p>
      </div>
      {!disabled && (
        <ChevronRight className="w-4 h-4 shrink-0" style={{ color: MUTED }} />
      )}
    </button>
  );
}

/* ─── Step indicator ─────────────────────────────────────────────────────────── */

function StepDots({ current }: { current: ImportStep }): React.ReactElement {
  const steps: ImportStep[] = ["source", "preview", "confirm"];
  const idx = steps.indexOf(current);
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((s, i) => (
        <div
          key={s}
          className="rounded-full transition-all"
          style={{
            width: i === idx ? 20 : 6,
            height: 6,
            background: i <= idx ? PRIMARY : "oklch(0.30 0.01 260)",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Preview table row ──────────────────────────────────────────────────────── */

function PreviewRow({
  player,
  rowIndex,
}: {
  player: ImportedPlayer;
  rowIndex: number;
}): React.ReactElement {
  return (
    <tr
      className="border-b"
      style={{ borderColor: "oklch(0.22 0.01 260)" }}
    >
      <td
        className="py-2 px-3 text-[11px] font-mono"
        style={{ color: MUTED }}
      >
        {rowIndex + 1}
      </td>
      <td className="py-2 px-3">
        <div className="flex items-center gap-1.5">
          {player.valid ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: SUCCESS }} />
          ) : (
            <XCircle className="w-3.5 h-3.5 shrink-0" style={{ color: DANGER }} />
          )}
          <span
            className="text-[12.5px] font-medium"
            style={{ color: player.valid ? "oklch(0.93 0.01 260)" : DANGER }}
          >
            {player.name || "(blank)"}
          </span>
        </div>
      </td>
      <td
        className="py-2 px-3 text-[12px]"
        style={{ color: "oklch(0.75 0.01 260)" }}
      >
        {player.position || "—"}
      </td>
      <td
        className="py-2 px-3 text-[12px]"
        style={{ color: "oklch(0.75 0.01 260)" }}
      >
        {player.jerseyNumber ? `#${player.jerseyNumber}` : "—"}
      </td>
      <td
        className="py-2 px-3 text-[12px]"
        style={{ color: "oklch(0.75 0.01 260)" }}
      >
        Gr. {player.grade || "—"}
      </td>
      <td
        className="py-2 px-3 text-[12px]"
        style={{ color: "oklch(0.75 0.01 260)" }}
      >
        {player.parentName || "—"}
      </td>
      <td className="py-2 px-3">
        {player.errors.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {player.errors.map((err) => (
              <span
                key={err}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                style={{ background: `${DANGER}20`, color: DANGER }}
              >
                {err}
              </span>
            ))}
          </div>
        )}
      </td>
    </tr>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────────── */

export default function RosterImportPage(): React.ReactElement {
  const [step, setStep] = useState<ImportStep>("source");
  const [source, setSource] = useState<ImportSource | null>(null);
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [players, setPlayers] = useState<ImportedPlayer[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);

  const validCount  = players.filter((p) => p.valid).length;
  const invalidCount = players.filter((p) => !p.valid).length;

  function handleSourceSelect(src: ImportSource): void {
    setSource(src);
    if (src === "csv_paste") {
      // Pre-parse so the preview is immediately ready when we arrive
      setPlayers(parseRosterCsv(csvText));
      setStep("preview");
    }
  }

  function handleReparse(): void {
    setPlayers(parseRosterCsv(csvText));
  }

  function handleConfirm(): void {
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      setDone(true);
      setStep("confirm");
      toast.success(`${validCount} player${validCount !== 1 ? "s" : ""} imported successfully`);
    }, 900);
  }

  function handleReset(): void {
    setStep("source");
    setSource(null);
    setCsvText(SAMPLE_CSV);
    setPlayers([]);
    setDone(false);
  }

  /* ── Success screen ─────────────────────────────────────────────────────── */
  if (done) {
    return (
      <div className="min-h-screen" style={{ background: "oklch(0.12 0.01 260)", color: "oklch(0.93 0.01 260)" }}>
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b"
          style={{ background: "oklch(0.14 0.01 260)", borderColor: "oklch(0.22 0.01 260)" }}
        >
          <Link href="/app/coach/program">
            <a className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-4 h-4" style={{ color: MUTED }} />
            </a>
          </Link>
          <span className="text-[15px] font-semibold">Roster Import</span>
        </div>

        <div className="flex flex-col items-center justify-center gap-6 px-6 py-20">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: `${SUCCESS}20` }}
          >
            <CheckCircle2 className="w-8 h-8" style={{ color: SUCCESS }} />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-[20px] font-bold">Import complete</h2>
            <p className="text-[14px]" style={{ color: MUTED }}>
              {validCount} player{validCount !== 1 ? "s" : ""} added to roster
              {invalidCount > 0 && ` · ${invalidCount} row${invalidCount !== 1 ? "s" : ""} skipped`}
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-sm">
            <Link href="/app/coach/program">
              <a
                className="w-full text-center py-2.5 rounded-lg text-[13px] font-semibold transition-colors"
                style={{ background: PRIMARY, color: "#fff" }}
              >
                Back to Program Hub
              </a>
            </Link>
            <button
              onClick={handleReset}
              className="w-full py-2.5 rounded-lg text-[13px] font-semibold border transition-colors"
              style={{ borderColor: "oklch(0.28 0.015 260)", color: "oklch(0.75 0.01 260)" }}
            >
              Import another file
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main layout ─────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background: "oklch(0.12 0.01 260)", color: "oklch(0.93 0.01 260)" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 border-b"
        style={{ background: "oklch(0.14 0.01 260)", borderColor: "oklch(0.22 0.01 260)" }}
      >
        <div className="flex items-center gap-3">
          {step !== "source" ? (
            <button
              onClick={() => setStep(step === "preview" ? "source" : "preview")}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" style={{ color: MUTED }} />
            </button>
          ) : (
            <Link href="/app/coach/program">
              <a className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                <ArrowLeft className="w-4 h-4" style={{ color: MUTED }} />
              </a>
            </Link>
          )}
          <div>
            <span className="text-[15px] font-semibold">Roster Import</span>
            <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
              {step === "source" ? "Choose import method" : step === "preview" ? "Review & validate" : "Confirm"}
            </p>
          </div>
        </div>
        <StepDots current={step} />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* ── STEP 1: Source selection ─────────────────────────────────────── */}
        {step === "source" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[17px] font-bold">How would you like to import?</h2>
              <p className="text-[13px] mt-1" style={{ color: MUTED }}>
                Choose a method to add players to this program's roster.
              </p>
            </div>

            <div className="space-y-3">
              <SourceOption
                icon={<ClipboardPaste />}
                title="Paste CSV data"
                description="Paste a spreadsheet or CSV text directly. We'll validate each row instantly."
                onClick={() => handleSourceSelect("csv_paste")}
              />
              <SourceOption
                icon={<FileSpreadsheet />}
                title="Upload CSV file"
                description="Select a .csv file from your device. Same format as paste."
                badge="Coming soon"
                onClick={() => {}}
                disabled
              />
              <SourceOption
                icon={<UserPlus />}
                title="Add manually"
                description="Enter players one by one using a guided form."
                badge="Coming soon"
                onClick={() => {}}
                disabled
              />
            </div>

            {/* Format guide */}
            <div
              className="rounded-xl border p-4 space-y-3"
              style={{ borderColor: "oklch(0.26 0.015 260)", background: "oklch(0.15 0.01 260)" }}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" style={{ color: WARNING }} />
                <span className="text-[12.5px] font-semibold" style={{ color: WARNING }}>
                  Expected CSV format
                </span>
              </div>
              <p className="text-[12px]" style={{ color: MUTED }}>
                Include a header row followed by one player per line. Columns:
              </p>
              <code
                className="block text-[11px] px-3 py-2 rounded-lg"
                style={{ background: "oklch(0.10 0.01 260)", color: "oklch(0.80 0.01 260)" }}
              >
                Name, Position, Jersey #, Grade, Parent Name, Parent Email, Parent Phone
              </code>
              <button
                className="flex items-center gap-1.5 text-[11.5px] font-semibold transition-colors"
                style={{ color: PRIMARY }}
                onClick={() => {
                  navigator.clipboard.writeText(SAMPLE_CSV).then(() => toast.success("Sample CSV copied"));
                }}
              >
                <Download className="w-3.5 h-3.5" />
                Copy sample CSV to clipboard
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Paste & preview ──────────────────────────────────────── */}
        {step === "preview" && (
          <div className="space-y-5">
            {/* Paste area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-semibold" style={{ color: "oklch(0.85 0.01 260)" }}>
                  CSV data
                </label>
                <button
                  onClick={handleReparse}
                  className="flex items-center gap-1 text-[11.5px] font-semibold transition-colors"
                  style={{ color: PRIMARY }}
                >
                  <RotateCcw className="w-3 h-3" />
                  Re-parse
                </button>
              </div>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                onBlur={handleReparse}
                rows={7}
                spellCheck={false}
                className="w-full rounded-lg border px-3 py-2.5 text-[12px] font-mono resize-none focus:outline-none focus:ring-1"
                style={{
                  background: "oklch(0.10 0.01 260)",
                  borderColor: "oklch(0.28 0.015 260)",
                  color: "oklch(0.85 0.01 260)",
                  caretColor: PRIMARY,
                }}
              />
            </div>

            {/* Summary bar */}
            {players.length > 0 && (
              <div
                className="flex items-center gap-4 rounded-lg border px-4 py-2.5"
                style={{ borderColor: "oklch(0.26 0.015 260)", background: "oklch(0.15 0.01 260)" }}
              >
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: SUCCESS }} />
                  <span className="text-[12.5px] font-semibold" style={{ color: SUCCESS }}>
                    {validCount} valid
                  </span>
                </div>
                {invalidCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" style={{ color: DANGER }} />
                    <span className="text-[12.5px] font-semibold" style={{ color: DANGER }}>
                      {invalidCount} with errors
                    </span>
                  </div>
                )}
                <span className="ml-auto text-[11.5px]" style={{ color: MUTED }}>
                  {players.length} row{players.length !== 1 ? "s" : ""} parsed
                </span>
              </div>
            )}

            {/* Preview table */}
            {players.length > 0 && (
              <div
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: "oklch(0.22 0.01 260)" }}
              >
                <div
                  className="px-4 py-2.5 border-b"
                  style={{ borderColor: "oklch(0.22 0.01 260)", background: "oklch(0.15 0.01 260)" }}
                >
                  <span className="text-[12px] font-semibold" style={{ color: "oklch(0.75 0.01 260)" }}>
                    Preview
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr
                        className="border-b text-[10.5px] font-semibold uppercase tracking-wide"
                        style={{ borderColor: "oklch(0.22 0.01 260)", color: MUTED }}
                      >
                        <th className="py-2 px-3 w-8">#</th>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Pos</th>
                        <th className="py-2 px-3">Jersey</th>
                        <th className="py-2 px-3">Grade</th>
                        <th className="py-2 px-3">Parent</th>
                        <th className="py-2 px-3">Errors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((p, i) => (
                        <PreviewRow key={i} player={p} rowIndex={i} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {players.length === 0 && (
              <div
                className="rounded-xl border py-10 flex flex-col items-center gap-2"
                style={{ borderColor: "oklch(0.22 0.01 260)" }}
              >
                <AlertCircle className="w-6 h-6" style={{ color: MUTED }} />
                <p className="text-[13px]" style={{ color: MUTED }}>
                  Paste CSV data above and click Re-parse
                </p>
              </div>
            )}

            {/* CTA */}
            {validCount > 0 && (
              <button
                onClick={handleConfirm}
                disabled={importing}
                className="w-full py-3 rounded-xl text-[14px] font-bold transition-opacity"
                style={{ background: PRIMARY, color: "#fff", opacity: importing ? 0.7 : 1 }}
              >
                {importing ? "Importing…" : `Import ${validCount} player${validCount !== 1 ? "s" : ""}`}
                {invalidCount > 0 && ` (skip ${invalidCount} invalid)`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
