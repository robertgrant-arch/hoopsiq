# HoopsOS — Architecture & Product Documentation

This directory contains the full architecture and product planning sequence produced in May 2026.
Documents are ordered — each builds on the previous.

| # | Document | Contents |
|---|---|---|
| 01 | [VSA Audit](./01-vsa-audit.md) | Vertical slice architecture audit — violations found and refactors specified |
| 02 | [Product Architecture](./02-product-architecture.md) | Market position, pillars, feature inventory, personas, differentiators |
| 03 | [Slice Specs](./03-slice-specs.md) | Detailed product specs for Dashboard, Academy, Assessments, Manager Labs, Coaching, Admin/Billing |
| 04 | [Information Architecture](./04-information-architecture.md) | Sitemap, navigation hierarchy, routes, role-based nav, search, command palette |
| 05 | [Roadmap](./05-roadmap.md) | P0/P1/P2 roadmap, sequencing, staffing model, anti-scope list |
| 06 | [Engineering Conventions](./06-engineering-conventions.md) | Repo structure, slice template, import rules, testing strategy, code review checklist |
| 07 | [Product Strategy](./07-product-strategy.md) | Market wedge, category, differentiators, homepage narrative, defensibility loop |
| 08 | [Execution Backlog](./08-execution-backlog.md) | 212 tasks — epics, engineering, design, analytics, QA tasks per slice |
| 09 | [Execution Backlog P2](./09-execution-backlog-p2.md) | 100 additional tasks — P2 completions, Messaging, Recruiting, Navigation, Search, Mobile |

## Quick Reference

**The wedge**: Film → annotation → coaching action → IDP focus area. Three taps. No other tool does this.

**The two product pillars**: Coach Intelligence (film, actions, practice, readiness) and Player Development (IDP, assessments, film feedback, skill tracking, progression).

**The development loop**: Assess → Plan (IDP) → Train (WOD + assignments) → Review (film feedback) → Progress (skill scores, timeline).

**The smallest V1**: Readiness check-in + Film annotation + Coaching action + Practice plan + IDP + Parent digest + Billing.

**V1 release gate**: Week 28. After the film loop is wired. Before analytics are attempted.

**Total backlog**: 312 tasks across 13 categories.

## Player Development Domain

Player Development is a first-class product area — equal in weight to the coach-side Coaching Intelligence features.

| Surface | Player Development entry point |
|---|---|
| Player mobile tabs 1–5 | Home · **My Plan** · Check-In · Assignments · Skills |
| Coach sidebar DEVELOP | Quick Assess · Assessments · Observation Quality · Film Corroboration · Benchmarking · IDP Builder |
| Core player routes | `/app/player/development` (IDP hub) · `/app/player/assessments` · `/app/player/skills` · `/app/player/timeline` |
| Coach-side routes | `/app/coach/assessments` · `/app/coach/idp/generate` · `/app/coach/benchmarks` · `/app/coach/development-outcomes` |

**The player development loop in routes:**
```
/app/player/checkin          → daily readiness signal
/app/player/development      → IDP hub (My Plan) — focus areas, milestones, drills
/app/player/assignments      → film clips + drills assigned by coach
/app/player/skills           → skill tracks (progress over time)
/app/player/assessments      → scored assessment history
/app/player/timeline         → chronological development record
/app/player/skill-velocity   → rate-of-improvement charts
/app/player/milestones       → achievement milestones
```
