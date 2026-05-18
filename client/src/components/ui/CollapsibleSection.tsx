/**
 * CollapsibleSection — reusable card section with animated expand/collapse.
 *
 * Design contract:
 *   - Provides the full card shell (rounded-xl border bg-card) so child content
 *     only needs to supply the body (divide-y rows, empty states, etc.)
 *   - Uses CSS grid-template-rows transition — no max-height hack, no Framer Motion
 *   - Fully accessible: aria-expanded, aria-controls, focus-visible ring
 *   - "View all" link lives outside the <button> to avoid nested interactive elements
 *
 * Persistence pattern (future):
 *   Pass `id` + `onToggle` and write to localStorage keyed by
 *   `${coachId}:section:${id}` in the onToggle callback.
 *   On mount, read that key and pass its value as `defaultOpen`.
 */

import { useState, useId } from "react";
import { ChevronDown, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export interface CollapsibleSectionProps {
  /** Section heading text */
  title: string;
  /** Numeric count badge rendered next to the title. 0 renders in muted style. */
  count?: number;
  /** Open on first render. Default: false */
  defaultOpen?: boolean;
  /**
   * Short descriptor shown inline in the header when the section is collapsed.
   * Gives coaches a glanceable summary without expanding.
   * Example: "3 items need review"
   */
  summary?: string;
  /** Target for the "View all" anchor in the header right slot */
  href?: string;
  /** Label for the view-all link. Default: "View all" */
  linkLabel?: string;
  /**
   * Custom React node rendered in the header right slot.
   * Overrides `href` / `linkLabel` when provided.
   * Use for action buttons, multi-link clusters, etc.
   */
  actionsSlot?: React.ReactNode;
  /**
   * Stable id string used to build the aria-controls value.
   * When omitted, a generated id is used. Provide a stable value
   * if you intend to persist open/closed state.
   */
  id?: string;
  /** Callback fired after each toggle with the new open state */
  onToggle?: (open: boolean) => void;
  children: React.ReactNode;
  /** Extra classes applied to the outer card div */
  className?: string;
}

export function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  summary,
  href,
  linkLabel = "View all",
  actionsSlot,
  id: externalId,
  onToggle,
  children,
  className,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const generatedId = useId();
  const contentId = externalId
    ? `${externalId}-body`
    : `cs-${generatedId.replace(/:/g, "")}-body`;

  function toggle() {
    const next = !open;
    setOpen(next);
    onToggle?.(next);
  }

  return (
    <div className={`rounded-xl border border-border bg-card ${className ?? ""}`}>
      {/* ------------------------------------------------------------------ */}
      {/* Header row                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div
        className={`flex items-center px-5 py-4 gap-3${open ? " border-b border-border" : ""}`}
      >
        {/*
         * Toggle button occupies all remaining space to the left.
         * Kept as a <button> so keyboard users can toggle with Space/Enter.
         * The "View all" link is a sibling, NOT inside this button.
         */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={toggle}
          className="flex items-center gap-2 flex-1 min-w-0 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded"
        >
          <ChevronDown
            className="w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform duration-200"
            style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
            aria-hidden="true"
          />

          <h3 className="font-bold text-[15px] shrink-0 leading-none">{title}</h3>

          {count != null && (
            <span
              className="text-[10.5px] font-mono font-semibold px-1.5 py-0.5 rounded-full shrink-0 leading-none"
              style={
                count > 0
                  ? {
                      background: "oklch(0.72 0.18 290 / 0.12)",
                      color: "oklch(0.72 0.18 290)",
                    }
                  : {
                      background: "oklch(0.55 0.02 260 / 0.08)",
                      color: "oklch(0.55 0.02 260)",
                    }
              }
            >
              {count}
            </span>
          )}

          {/* Summary — only visible when collapsed, fades in via opacity transition */}
          <span
            className="text-[12px] text-muted-foreground truncate ml-1 transition-opacity duration-150"
            style={{ opacity: open ? 0 : 1, pointerEvents: "none" }}
            aria-hidden={open}
          >
            {!open && summary ? summary : ""}
          </span>
        </button>

        {/* Right slot — view-all link or custom actions */}
        {(href != null || actionsSlot != null) && (
          <div className="shrink-0 flex items-center gap-2">
            {actionsSlot ??
              (href != null && (
                <Link href={href} asChild>
                  <a className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                    {linkLabel}
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </a>
                </Link>
              ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Animated body                                                       */}
      {/* grid-template-rows: 0fr → 1fr is the smoothest CSS-only approach.  */}
      {/* The inner div needs overflow:hidden + min-height:0 to collapse.     */}
      {/* ------------------------------------------------------------------ */}
      <div
        id={contentId}
        role="region"
        aria-labelledby={undefined}
        aria-hidden={!open}
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 220ms ease",
        }}
      >
        <div style={{ overflow: "hidden", minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
