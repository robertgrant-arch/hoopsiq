import { AlertTriangle, Ban, CheckCircle2, HelpCircle } from "lucide-react";
import { type ReadinessStatus, type ReadinessConfidence, statusColor, statusLabel } from "./types";

interface Props {
  status:     ReadinessStatus;
  confidence: ReadinessConfidence;
  /** Show summary text next to icon */
  showLabel?: boolean;
  /** Smaller pill variant */
  size?: "sm" | "md";
  /** Tooltip text (summary) — rendered as title attr */
  title?: string;
}

const ICON: Record<ReadinessStatus, React.ReactNode> = {
  RESTRICTED: <Ban       className="w-3 h-3 shrink-0" />,
  FLAGGED:    <AlertTriangle className="w-3 h-3 shrink-0" />,
  READY:      <CheckCircle2 className="w-3 h-3 shrink-0" />,
  UNKNOWN:    <HelpCircle   className="w-3 h-3 shrink-0" />,
};

/** Dim the badge when confidence is low/none to communicate uncertainty. */
function opacityForConfidence(c: ReadinessConfidence) {
  if (c === "none")   return "opacity-50";
  if (c === "low")    return "opacity-70";
  return "";
}

export function ReadinessStatusBadge({ status, confidence, showLabel = true, size = "sm", title }: Props) {
  const c = statusColor(status);
  const padding = size === "md" ? "px-2.5 py-1" : "px-2 py-0.5";
  const fontSize = size === "md" ? "text-[12px]" : "text-[11px]";
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full font-semibold border ${padding} ${fontSize} ${opacityForConfidence(confidence)}`}
      style={{ color: c.text, background: c.bg, borderColor: c.border }}
    >
      {ICON[status]}
      {showLabel && <span>{statusLabel(status)}</span>}
      {confidence === "low"  && showLabel && <span className="font-normal opacity-60">(low confidence)</span>}
      {confidence === "none" && showLabel && <span className="font-normal opacity-60">(no data)</span>}
    </span>
  );
}
