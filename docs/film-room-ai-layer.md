# Film Room AI Assist Layer — Spec

Companion to the Film Room v2 spec set. Replaces "AI-powered pattern
detection / confirm, dismiss, or escalate insights" with a bounded assist
layer.

## The contract

1. **Suggest-only.** Every AI output is an `ai_suggestions` row in state
   `suggested`. The only transitions are coach `accept` / `dismiss`. There is
   no code path from any suggestion to a clip assignment, a player
   notification, or an IDP item. Enforced at the API layer, not just the UI.
2. **Evidence or silence.** Every claim carries ≥1 timestamp range in the
   source film. A suggestion that can't cite its moment is dropped
   server-side before a coach ever sees it.
3. **Calibrated language.** Output includes a numeric confidence; rendered
   language is generated *from* that number (see confidence model) — the
   model never writes "clearly," "always," or "definitely."
4. **Coach voice, coach ownership.** Drafts imitate the coach's prior notes;
   accepted drafts are visibly marked "AI draft" until the coach edits or
   saves; nothing AI-written reaches a player unless a coach saved it.
5. **Degrade to nothing.** Every surface works with the AI layer absent.
   Low confidence → fewer suggestions, never hedged noise.

Pipeline position: CV/tracking pipeline (existing `analysis_jobs`) emits
timestamped events → the assist layer (LLM + heuristics) composes
suggestions → `ai_suggestions` rows → panel UI. The LLM never sees raw
video; it reasons over structured events, clip metadata, and coach history.

---

## Capabilities

### A. Clip boundary suggestions
| | |
|---|---|
| Trigger | analysis job completes on a session; re-runs if the job is re-processed |
| Input | detected events (steals, scores, defensive breakdowns, transitions) with timestamps + confidence from CV; session type; existing clips (to avoid suggesting already-clipped moments) |
| Output | `clip_suggestion` schema (below); rendered as amber timeline ticks + panel rows |
| Confidence | CV event confidence × event-type prior (org-tunable); floor 0.55 to surface at all |
| Approval | coach snaps to (`S`) or accepts a row → creates a `draft` clip with `source: ai_accepted`, or ignores entirely |
| Failure | CV job failed / zero events over floor → panel section absent; film fully usable |
| Low-conf fallback | 0.40–0.55 collapse under "12 more low-confidence moments" — opt-in expansion, never mixed with the main list |

### B. Title / category / tag suggestions
| | |
|---|---|
| Trigger | clip drawer opens on a draft (coach-marked or AI-accepted) |
| Input | events within the clip's bounds; roster (jersey detection → player candidates); coach's historical category usage for similar events |
| Output | inline: ghost-text title, pre-listed **unselected** category and player chips |
| Confidence | per-field; title 0.6 floor, player-tag 0.7 floor (mis-tagging a player is the costliest error) |
| Approval | typing over ghost text discards it; each chip requires an explicit tap |
| Failure | fields simply render empty — identical to AI-off |
| Low-conf fallback | below floor, nothing renders; no "maybe #23?" noise in the tagging path |

### C. Draft note in coach voice
| | |
|---|---|
| Trigger | coach taps "Draft with AI" in the note editor — **never automatic** |
| Input | clip events + bounds; tagged players; the coach's last ~50 saved notes (style corpus); team terminology dictionary (existing Program Terminology feature) |
| Output | `note_suggestion` schema; fills the editor marked "AI draft — edit or save to make it yours" |
| Confidence | composite of event-grounding score and style-match; shown as none/low badge only (a note is judged by reading, not a meter) |
| Approval | the save. Unedited AI drafts save with `note_source: ai_draft_accepted` for later quality auditing |
| Failure | button disabled with tooltip ("draft unavailable — analysis incomplete") |
| Low-conf fallback | grounding < 0.5 → button produces a skeleton instead: "P1 — [what happened]. Teaching point: [correction]. Look for: [next rep]." — structure without invented content |

### D. Cross-clip pattern summary (recurring mistakes / wins)
| | |
|---|---|
| Trigger | coach opens Player Progress detail or a player's clip-filtered Workspace view; computed on demand, cached 24h |
| Input | that player's clips + categories + coach notes + response text over a window (30d default) |
| Output | ≤3 bullet patterns, each citing ≥2 clip references (id + timestamp), e.g. "Late weak-side rotation appears in 4 clips over 2 weeks [c1, c4, c7, c9]" |
| Confidence | requires ≥2 evidence clips; below that the pattern is discarded, never softened |
| Approval | read-only for the coach; a "create IDP item from this pattern" action hands off to the escalation flow (capability E) |
| Failure | section renders "Not enough clip history for patterns yet (needs 3+ clips)" |
| Low-conf fallback | fewer bullets — 0 is acceptable and rendered as the failure copy above |

### E. IDP escalation recommendation
| | |
|---|---|
| Trigger | pattern summary crosses threshold (≥3 same-category clips in 21d) or a responded assignment matches an active IDP focus area |
| Input | pattern evidence, player's active IDP focus areas, prior escalations (dedup) |
| Output | `idp_recommendation` schema; renders as a small "Suggested for IDP" badge on the clip/queue row — a badge, not a modal, not a task |
| Confidence | 0.7 floor; recommendations also suppressed if the coach dismissed a same-category recommendation for this player <14d ago |
| Approval | coach clicks badge → standard escalation picker prefilled; escalating without the badge is always equally available |
| Failure | no badge — escalation flow unaffected |
| Low-conf fallback | none. Below floor = invisible. A wrong IDP nudge costs coach trust disproportionately |

### F. Duplicate / near-duplicate detection
| | |
|---|---|
| Trigger | clip save; batch pass when boundary suggestions generate |
| Input | temporal overlap; event-set similarity; (later) visual embedding similarity |
| Output | non-blocking drawer flag: "Resembles Clip 4 (78% overlap) — Compare" with side-by-side on tap |
| Confidence | overlap % shown as the plain fact it is; flag at >60% |
| Approval | informational only — coach may keep both, merge tags, or delete their new draft |
| Failure | silent absence |
| Low-conf fallback | <60% never shown |

### G. Review prioritization (likely useful moments)
| | |
|---|---|
| Trigger | ordering of the boundary-suggestion list (capability A's sort key) |
| Input | event confidence, event-type priors, tagged-player IDP focus areas ("this player has an active closeout focus — closeout events rank up"), coach's historical accept/dismiss pattern |
| Output | sort order + one-line "why" ("matches Moore's active IDP focus") on each suggestion row |
| Confidence | it's a ranking — no threshold; the "why" line is required (no unexplained ordering) |
| Approval | none needed (ordering isn't a claim); accepts/dismissals feed the ranker |
| Failure | falls back to chronological order |
| Low-conf fallback | chronological order, no fake "top pick" framing |

---

## Confidence model (shared)

- Numeric 0–1 stored on every suggestion (`confidence`), composed of source
  signal (CV event score) × capability prior × context modifiers.
- **Rendered as calibrated language, never raw percentages, in player-adjacent
  or note text; UI chrome may show the number in the suggestion panel:**
  - ≥0.85 → state plainly ("Weak-side rotation is late at 23:41")
  - 0.65–0.85 → hedged once ("Looks like a late rotation at 23:41")
  - 0.55–0.65 → question form ("Possible late rotation at 23:41 — worth a look?")
  - <0.55 → not shown (or collapsed under low-confidence expansion where the
    capability allows it)
- Accept/dismiss outcomes are logged per capability and per coach; weekly
  batch recalibration adjusts capability priors. The Insights Archive tab is
  the human-readable audit of this loop.

---

## System prompt

```
You are the film-analysis assistant inside HoopsIQ, a basketball coaching
platform. You support a human coach who is reviewing game, practice, or
skill-rep film. The coach makes every decision. You draft and suggest; you
never act.

INPUTS YOU RECEIVE
- Structured, timestamped events detected in the film (never raw video)
- Clip metadata: bounds, session type, tagged players, categories
- The coach's recent saved notes (style reference) and the program's
  terminology dictionary
- Player context when provided: active IDP focus areas, recent clip history

HARD RULES
1. Evidence: every claim you make MUST reference at least one timestamp or
   timestamp range present in the input events. If you cannot ground a
   statement in a provided event, do not make it.
2. Certainty: never overstate. You receive a confidence value with each
   event. Use plain statements only above 0.85; hedge once ("looks like",
   "appears") between 0.65 and 0.85; phrase as a question below that. Never
   use "always", "clearly", "definitely", or absolute frequency claims
   ("every time") unless the input contains counts supporting them.
3. Coaching claims: describe what is observable in the events (positioning,
   timing, outcome). Do not speculate about effort, attitude, or intent.
   Do not diagnose injuries or physical conditions.
4. Voice: when drafting notes, match the coach's style samples — their
   length, tone, and terminology (use the program dictionary's terms).
   Default to 1–3 sentences: what happened, the teaching point, what to do
   next rep. Write TO the player only if the style samples do; otherwise
   write as coach shorthand.
5. Scope: output only the JSON schema requested. No preamble, no coaching
   philosophy, no praise of the platform. If the input is insufficient for
   the requested output, return the schema's insufficient_evidence form
   rather than inventing content.
6. You never address players directly in any delivery sense. Everything you
   produce is a draft for the coach. Never imply to the coach that
   something has been sent, assigned, or shared.

QUALITY BAR
A good suggestion saves the coach 10+ seconds and is specific enough to act
on without re-watching. When in doubt between two suggestions, output the
one with stronger timestamp evidence. Fewer, better suggestions beat
coverage.
```

---

## Output schemas

### Clip suggestions

```json
{
  "$id": "clip_suggestion.v1",
  "type": "object",
  "required": ["session_id", "suggestions"],
  "properties": {
    "session_id": { "type": "string", "format": "uuid" },
    "suggestions": {
      "type": "array", "maxItems": 20,
      "items": {
        "type": "object",
        "required": ["start_ms", "end_ms", "event_refs", "confidence",
                     "suggested_title", "rationale"],
        "properties": {
          "start_ms":  { "type": "integer", "minimum": 0 },
          "end_ms":    { "type": "integer", "exclusiveMinimum": 0 },
          "event_refs": { "type": "array", "minItems": 1,
                          "items": { "type": "string" },
                          "description": "ids of detected events grounding this suggestion" },
          "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
          "suggested_title": { "type": "string", "maxLength": 80 },
          "suggested_categories": { "type": "array", "maxItems": 3,
                                    "items": { "type": "string" } },
          "suggested_player_ids": { "type": "array",
                                    "items": { "type": "string", "format": "uuid" },
                                    "description": "only when jersey detection ≥ 0.7" },
          "rationale": { "type": "string", "maxLength": 140,
                         "description": "one line, shown as the 'why' on the row" },
          "priority_rank": { "type": "integer", "minimum": 1 },
          "duplicate_of_clip_id": { "type": ["string", "null"], "format": "uuid" }
        }
      }
    },
    "insufficient_evidence": { "type": "boolean", "default": false }
  }
}
```

### Note suggestions

```json
{
  "$id": "note_suggestion.v1",
  "type": "object",
  "required": ["clip_id", "status"],
  "properties": {
    "clip_id": { "type": "string", "format": "uuid" },
    "status": { "enum": ["ok", "insufficient_evidence"] },
    "draft": {
      "type": "object",
      "required": ["text", "evidence", "grounding_score"],
      "properties": {
        "text": { "type": "string", "maxLength": 500,
                  "description": "1–3 sentences in coach voice" },
        "evidence": { "type": "array", "minItems": 1,
          "items": {
            "type": "object",
            "required": ["event_ref", "timestamp_ms"],
            "properties": {
              "event_ref":    { "type": "string" },
              "timestamp_ms": { "type": "integer" },
              "claim_span":   { "type": "string",
                                "description": "substring of text this event supports" }
            }
          }
        },
        "grounding_score":   { "type": "number", "minimum": 0, "maximum": 1 },
        "style_match_score": { "type": "number", "minimum": 0, "maximum": 1 },
        "terminology_used":  { "type": "array", "items": { "type": "string" },
                               "description": "program-dictionary terms included" }
      }
    },
    "skeleton": { "type": ["string", "null"],
                  "description": "fill-in template returned instead of draft when grounding < 0.5" }
  }
}
```

### IDP recommendations

```json
{
  "$id": "idp_recommendation.v1",
  "type": "object",
  "required": ["player_id", "status"],
  "properties": {
    "player_id": { "type": "string", "format": "uuid" },
    "status": { "enum": ["recommend", "no_recommendation"] },
    "recommendation": {
      "type": "object",
      "required": ["pattern_label", "evidence_clips", "confidence",
                   "suggested_focus_area", "rationale"],
      "properties": {
        "pattern_label": { "type": "string", "maxLength": 60,
                           "description": "e.g. 'Late weak-side rotations'" },
        "evidence_clips": {
          "type": "array", "minItems": 2,
          "items": {
            "type": "object",
            "required": ["clip_id", "timestamp_ms", "occurred_at"],
            "properties": {
              "clip_id":      { "type": "string", "format": "uuid" },
              "timestamp_ms": { "type": "integer" },
              "occurred_at":  { "type": "string", "format": "date-time" }
            }
          }
        },
        "confidence": { "type": "number", "minimum": 0.7, "maximum": 1,
                        "description": "below 0.7 must return no_recommendation" },
        "suggested_focus_area": {
          "type": "object",
          "properties": {
            "existing_focus_area_id": { "type": ["string", "null"], "format": "uuid" },
            "new_focus_area_label":   { "type": ["string", "null"], "maxLength": 60 }
          },
          "description": "prefer linking an existing active focus area"
        },
        "suggested_note": { "type": "string", "maxLength": 300,
                            "description": "prefill for the escalation picker; coach-editable" },
        "rationale": { "type": "string", "maxLength": 200,
                       "description": "shown verbatim on the badge tooltip, e.g. '4 clips in 14 days, same category'" },
        "prior_dismissal": { "type": ["string", "null"], "format": "date-time",
                             "description": "when coach last dismissed a same-category rec for this player; UI suppresses if < 14d" }
      }
    }
  }
}
```

Validation is enforced at the tool-call layer (structured output); rows
failing schema or the evidence rule are dropped and logged — they never
reach `ai_suggestions`.
```
