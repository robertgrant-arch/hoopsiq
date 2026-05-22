# HoopsIQ — Product Strategy Evaluation
## Sharp, Skeptical, Practical

> This is not a cheerleading document.  
> Every claim here is grounded in the actual codebase state, the competitive landscape, and first principles.  
> Where the platform is weak, this document says so directly.

---

## The Honest Starting Point

Before strategy: a calibration of what the platform actually is today versus what it's trying to be.

**What exists**: A comprehensively scaffolded frontend, a structurally sound data model, one complete server service layer (film-analysis), and a small number of wired frontend pages. The schema captures the right relationships — the `coaching_actions` bridge table correctly links film annotations to IDP focus areas, which is the key architectural insight.

**What doesn't exist yet**: The service logic for 17 of 18 server modules, the frontend API wiring for 60+ pages, and the behavioral loop that makes any of the analytics meaningful.

**What this means for strategy**: The platform has the right skeleton for a genuinely differentiated product. The strategy question is not "can we build it?" — the architecture says yes. The question is "what do we lead with, and to whom, before we've built everything?"

That question has one correct answer, and most of what follows is a consequence of it.

---

## 1. The Strongest Wedge Into the Market

### The wedge is not the platform. It is one specific moment.

Most platforms try to sell the full surface area — "do everything here." That's not a wedge; that's a pitch deck. A wedge is the single reason someone switches from what they're doing today.

The correct wedge for this platform is:

**A coach finishes reviewing film, clicks one button, and the player's development plan is updated — with the clip as evidence.**

That is the wedge. Not "all-in-one." Not "comprehensive." Not "AI-powered." One moment where something happens in this tool that cannot happen anywhere else, that solves an actual frustration coaches have every single week.

The frustration it solves: Coaches make hundreds of observations during film review. Those observations live in their head, in a notebook, in a voice memo, or nowhere. They almost never become individual development plans. They almost never get tracked. The player never sees the specific evidence for why they're being coached on something. The parent never understands why their child isn't starting. The coach can't prove their coaching is working.

The wedge moment eliminates all of that in a single gesture.

### Why this wedge specifically

It requires every other capability in the platform to be useful, which means once a team is using it, they need the film library, the IDP system, the practice planner, and the dashboard to make full use of the wedge. The wedge pulls the whole platform into the relationship.

It is not replicable by adding a feature to an existing product. Hudl cannot build this because they have no IDP system. DragonFly cannot build this because they have no film system. TeamSnap cannot build this because they have neither.

It produces a data artifact (the coaching action linked to a film moment and an IDP focus area) that grows in value over time. After 30 coaching actions, you have an evidence trail. After 100, you have a coaching record. After two seasons, you have a longitudinal development story that is genuinely irreplaceable.

---

## 2. The Category to Own

### What this is not

Do not call it:
- "All-in-one team management" — this is the category of tools that do too much and excel at nothing
- "Sports SaaS" — commodity framing; nobody searches for "sports SaaS"
- "LMS for coaches" — wrong connotation; LMS implies passive content consumption
- "Coaching intelligence platform" — intelligence is a dashboard feature, not a category

### What to call it

**Coached Development Platform**

Or in plain English: the system that makes coaching observations stick.

The claim embedded in this category name: coaching is the mechanism of development, and without a system to capture, connect, and track coaching observations, development is accidental. This platform makes it systematic.

This category is ownable because:
1. No incumbent occupies it — LMS vendors don't claim to connect observations to development; coaching tools don't claim to produce evidence of outcomes
2. It has a clear buyer pain point — "I coach hard but I can't prove it's working"
3. It has a clear user pain point — "I'm getting coached but I don't know what I'm supposed to be working on"
4. It scales conceptually — basketball programs today, engineering teams tomorrow, but only after the basketball case is proven

### The dual-market question (be honest about it)

The platform wants to serve both basketball programs AND engineering teams. Be direct: **this is a two-act strategy, not a simultaneous strategy.**

The basketball market is the right Act One because:
- The product was designed for it; the domain language is correct
- The competitive landscape is weaker (no well-funded incumbent owns the full loop)
- The buyer is concrete (club directors, head coaches) and findable
- The use case is visceral and visual (film is compelling; JIRA tickets are not)
- The "play loop" concept (observation → action → practice → assessment) translates perfectly to the engineering context, but only AFTER it's been proven and articulated in basketball

Engineering management (Act Two) is correct but premature. The platform's concepts — film review maps to incident retrospectives and code review; IDPs map to growth frameworks; coaching actions map to 1:1 follow-ups; Manager Labs maps to engineering velocity dashboards — are real and commercially valuable. But a startup cannot establish category leadership in two markets simultaneously. Basketball first. Prove the methodology. License the playbook to engineering orgs in year three.

---

## 3. Why This Is Better Than Each Competitor Type

### vs. Generic LMS (Canvas, Blackboard, Thinkific, LearnWorlds)

**The LMS assumption that's wrong**: Learning is self-directed, the learner knows what they need to learn, completion of content equals development.

**Why it's wrong for coached development**: Nobody knows they need to work on "contact layup balance when moving left" until a coach sees it on film and tags it. Nobody completes a drill module and spontaneously changes their technique on court without a coach present to observe it. The learning is inseparable from the observation that triggered it and the practice that reinforces it.

**What this platform does that LMS cannot**:
- Content is prescribed from observation, not browsed from a catalog
- Completion of a drill is confirmed by a coaching action being resolved, not by clicking through a video
- Progress is measured in behavior change on a specific skill, not course completion percentage
- The parent doesn't see a grade — they see "Marcus improved his contact finishing score from 5 to 7 over 6 weeks"

**The honest weakness**: Building a proper content authoring system (learning paths, module players, certifications) is expensive and not the wedge. Do not invest heavily in LMS features. The drill library and film assignment are the Academy features that matter. Everything else is a Phase 3 curiosity.

---

### vs. Engineering Management Dashboards and Sports SaaS Dashboards (Lattice, Leapsome, Hudl, TeamSnap, SportsEngine)

**What Lattice/Leapsome/15Five get right**: Structured performance reviews, goal tracking, continuous feedback. They understood that annual reviews are too infrequent.

**What they miss**: They measure retrospective output (goals met, ratings submitted) with no mechanism to connect manager coaching observations to measurable behavior change. A manager fills in a rating. Nothing provably changes. The tool is a record-keeping system, not a development system.

**What Hudl gets right**: Film quality and tagging are excellent. The annotation tooling is mature.

**What Hudl misses**: Annotations are a dead end. A tagged moment on film in Hudl goes nowhere. It doesn't create a development action. It doesn't update the player's IDP. It doesn't surface in the next practice plan. It doesn't produce a measurable development outcome. Hudl is a film archive with a highlight reel feature.

**What TeamSnap and SportsEngine get right**: Scheduling and billing UX are smooth. Parents know what to pay and where to be.

**What they miss**: Zero coaching intelligence. The coach is an afterthought. The development of the athlete is not part of the product.

**The platform's specific advantage over all of them**: The bridge. The `coaching_action` table connecting a film annotation to an IDP focus area to a practice plan drill to a skill assessment score. This data relationship doesn't exist anywhere else. It can't be added to Hudl with a feature sprint. It would require redesigning their product from scratch.

---

### vs. Internal Enablement Portals (Notion, Confluence, SharePoint, internal wikis)

**The fatal flaw of knowledge bases for development**: They are passive. You read a page. Nothing tracks whether you applied it. Nobody is alerted when you don't apply it. The "coaching" is a document. Documents don't adapt to what was observed on film last Tuesday.

**The category confusion to avoid**: Some programs and companies use their internal portal as the "official" place for development resources. They paste IDP templates into Notion and link to YouTube drills. This is not a development system; it is a filing system. The difference: a filing system stores what was agreed to; a development system tracks whether it happened and measures whether it worked.

This platform is not fighting for the same job. The platform does not store documents. It captures coaching observations and tracks whether those observations produced behavior change.

---

### vs. Developer Training Products (Pluralsight, Coursera, LinkedIn Learning, A Cloud Guru)

**Their business model is the problem**: They sell seat licenses for catalogs. More content = more value proposition. They are optimized for consumption metrics (hours watched, courses completed), which are almost entirely uncorrelated with actual behavior change on the job.

**The evidence from the research**: Multiple studies on corporate training find that 10% or less of training content is applied on the job within 90 days without deliberate reinforcement by a manager. The platform's architecture is essentially a reinforcement engine — coaching actions trigger learning, practice confirms application, assessment measures retention.

This is not a content platform. Do not build a content library. The Academy feature should contain drills and film assignments, not a Netflix-for-learning experience. Content without observation to trigger it and practice to reinforce it is expensive decoration.

---

## 4. The 5–7 Highest-Value Differentiators

These are ranked by: evidence they create lasting switching costs × uniqueness in the market × speed to deliver value.

### #1 — Observation-Triggered Development (The Wedge)

**What it is**: An IDP focus area is created from a film annotation, not from a self-reflection form. The player's development plan contains evidence of what was observed, when, in what game or practice, at what moment in the film.

**Why it's #1**: Every other development system starts with "what do you want to work on?" This one starts with "here's what I saw on film." That is a fundamentally different relationship between the coach and the learner. It shifts the burden of identification from self-awareness (unreliable) to observation (reliable). It also creates accountability: the coach can't say "I've been developing Marcus" without the data to prove it.

**What needs to be built**: The ClipActionBar `add_to_idp` flow, wired to real IDP focus areas. This is the single most important thing to ship.

---

### #2 — The Closed Development Loop

**What it is**: Film → Coaching Action → IDP Focus Area → Drill Assignment → Practice Execution → Skill Assessment → Score Change → Resolved Action. Every step is tracked. The loop closes.

**Why it matters**: No open-loop development system can prove it works. Open loops (LMS course → nothing, coaching conversation → nothing, performance review → nothing) produce no evidence of change. This platform's architecture produces a chain of evidence. After 6 weeks, you can show a parent: "Marcus was flagged for defensive balance in film on March 3. We added it to his IDP. He completed the assigned drills over 4 sessions. His defensive footwork assessment score went from 4 to 7. Here's the film clip from last Tuesday showing the improvement."

That conversation is currently impossible in any competing product. It is architecturally possible in this one.

**Status**: The schema is correct. The `coaching_actions` bridge table exists. The service logic doesn't. This is the highest-priority engineering deliverable after the wedge moment.

---

### #3 — Readiness as a Coaching Signal, Not Just a Health Metric

**What it is**: Daily check-ins (fatigue, sleep, soreness) are not just health data — they are coaching inputs that modify what gets planned in practice.

**Why competitors don't have this**: Health tracking apps don't connect to practice plans. Coaching apps don't have health signals. This platform connects them, and the connection is architecturally expressed: readiness flags surface in the practice plan builder sidebar, and restricted players are excluded from contact drills automatically.

**Why it creates daily habit**: Players must submit to know their status. Coaches must check before planning. This is the only feature that creates a daily mandatory touchpoint for both parties, which is what makes the platform sticky.

**Why it's a real differentiator**: The insight is that what a player can do today is as important as what they need to learn long-term. A platform that doesn't account for physical readiness is giving coaching advice without knowing the patient's current condition.

---

### #4 — Stakeholder Transparency With Evidence

**What it is**: Parents see development progress with evidence — not grades, not participation trophies, not generic feedback. They see: the focus area, the current score, the target score, the milestone progress, and a link to the coaching observation that triggered the focus area.

**Why it's commercially important**: Parents pay. Programs that can show parents their child is developing retain more players, command higher fees, and generate word-of-mouth referrals. Programs that cannot show development evidence lose players to competitors who "seem more serious."

**Why no competitor has it**: LMS platforms show completion. Scheduling apps show attendance. Neither shows development trajectory with evidence. This platform can.

**The honest caveat**: This only works if coaches are actually using the IDP and film annotation features consistently. If coaches don't use the platform, parents see nothing. The platform's value to parents is entirely derivative of coach adoption. Coach adoption is therefore not just a product goal — it is a commercial necessity.

---

### #5 — The Development Record as a Portable Asset

**What it is**: After two seasons, a player has a development record containing: every IDP focus area they've worked on, every assessment score trajectory, every coaching action created about them (with film evidence), every drill assigned to them, and every milestone achieved.

**Why it creates a moat**: This record cannot be recreated in any other tool. It cannot be exported to a competing platform without losing the evidence links. It becomes more valuable every season. It can be shared with college recruiters or future employers as a verifiable development portfolio — not a highlight reel assembled by the player, but a record assembled by coaches with evidence.

**Why this is the deepest switching cost**: The calendar, the billing history, the schedules — all of these can be migrated. The development record cannot. Once a program has three seasons of IDP data, assessment trajectories, and coaching actions for their players, they will not migrate to another platform.

---

### #6 — Coaching Accountability Without Surveillance

**What it is**: Manager Labs surfaces coaching activity metrics (action resolution rate, IDP update frequency, assessment frequency) to directors — but frames them as coaching health indicators, not performance ratings.

**Why it's valuable**: Directors currently evaluate coaching staff by feel and by program-level outcomes they cannot attribute to specific coaching behaviors. This platform creates an evidence-based alternative: "Coach Martinez's players improve at 1.4x the rate of Coach Thompson's players on the same skill category." That conversation is not possible with any current tool.

**Why the framing matters**: "Coaching surveillance" kills adoption. "Coaching accountability" builds professional pride. The distinction is in the design: coaches see their own metrics and can explain them; directors see aggregate patterns without real-time monitoring. This is a product design problem as much as a feature problem.

**What needs to not be built**: Real-time monitoring of coach activity. If a coach's dashboard shows "you haven't reviewed film in 6 days," that feels like a tracking badge. Instead: weekly digest to the coach themselves, monthly summary to the director. Pull, not push.

---

### #7 — Practice Planning That Reflects What You Saw

**What it is**: Practice plans are not built from templates. They are built from the intersection of: what was observed on film (open coaching actions), who is available (readiness status), and what the season schedule requires (upcoming games, assessed weaknesses).

**Why it's differentiable**: Every other practice planning tool is a blank canvas. You decide what to practice. This platform tells you what to practice based on what was just observed on film and who can participate today. The plan is responsive to the team's actual state.

**Why it matters for adoption**: A coaching workflow tool that makes practice planning faster and better-informed than a Google Doc is a tool coaches will use daily. Daily use means daily data. Daily data makes every other feature more valuable.

---

## 5. Weak and Commodity Features to De-emphasize

Be honest about what this platform should not compete on.

### Messaging and inbox

**Why it's commodity**: Every tool has messaging. Slack, GroupMe, WhatsApp, and email are free and better for pure communication. Messaging inside this platform is only valuable as a contextual integration (a coaching action generates a notification; an IDP milestone fires a parent digest). Messaging as a standalone communication tool is not a reason to buy.

**What to do**: Keep it, don't lead with it. Never use "team communication" as a selling point. The communication features exist to close loops, not to replace communication infrastructure.

---

### Scheduling and calendar management

**Why it's commodity**: TeamSnap has done this for 15 years. SportsEngine has done it for 10. The scheduling UX these tools have built is mature and familiar to every parent. Trying to compete with them on scheduling is a mistake.

**What to do**: Have scheduling because it is needed for context (readiness check-ins need to know if there's a game today; practice plans need to know what events follow). Never use "easy scheduling" as a selling point. Never A/B test scheduling UX improvements when coaching loop features are incomplete.

---

### AI film analysis as a headline feature

**Why it's premature**: The AI film analysis service interface exists and is well-designed, but AI video analysis at the quality level that would impress coaches — player tracking, play detection, automatic tagging — is extremely expensive to run and difficult to get right. Gemini and OpenAI's current video capabilities are impressive in demos and inconsistent in production on real game footage.

**What to do**: Manual annotation with AI as an accelerator (suggesting tags, surfacing highlights) is the right V1. Do not put "AI-powered film analysis" on the homepage until the model accuracy is genuinely impressive at the 95th percentile of your input data. An AI that misidentifies players or misses obvious defensive errors is worse than no AI at all — it breaks coach trust in the whole platform.

---

### Certifications and formal learning paths

**Why they're low-ROI in V1**: Certifications are only valuable if the market recognizes them. In basketball coaching, certifications from NABC or state associations are recognized. A HoopsIQ certification is not recognized by anyone yet. Building a certification system before you have the brand recognition to make the certificate meaningful is building a credential nobody wants.

**What to do**: Drill library and film assignments are the Academy features that create value immediately. Learning paths and certifications are Phase 3 — after two seasons of programs proving the development model works, the "HoopsIQ Certified Coach" credential becomes something worth pursuing.

---

### Wearable integrations

**Why they're premature**: Most grassroots basketball programs don't have wearable devices. The programs that do (elite AAU, D1 prep programs) use Catapult or Polar with dedicated athletic trainers — integrating with HoopsIQ is a nice-to-have, not a buying criteria. The integration is also technically complex (OAuth with device manufacturers, data normalization, load management algorithms) and distracts from the core coaching loop.

**What to do**: Build the data model for wearable signals (it exists in the schema). Don't build the actual integrations until three or more programs explicitly pay more for it.

---

### Document library and form management

**Why they're distraction**: Every team has a way to store and share documents. Google Drive, Dropbox, or a folder link in Slack handles this. Digital waiver signing is solved by DocuSign and equivalents. The fact that these are in the platform is fine — they reduce the number of tools a program needs. But they are never a reason a program chooses this platform over another.

**What to do**: Waivers and forms need to exist because they're part of the registration and billing workflow (you don't get paid without a signed waiver). Ship the minimum functional version and never improve it unless programs are actively complaining.

---

## 6. The Strongest Homepage and Sales Narrative

### What not to say

These are the phrases that kill positioning:

- "All-in-one platform for..." → Generic. Every platform says this.
- "Powered by AI" → Overused, undersupported in V1, creates expectation mismatch.
- "Manage your team better" → Better than what? Says nothing.
- "The modern LMS for sports" → Wrong category. Nobody wants an LMS.
- "Data-driven coaching" → Consultant-speak. Means nothing to a coach.

### The narrative frame

The platform's story is about a gap that every serious coach recognizes but nobody has solved:

> Coaching is constant. Development is supposed to be the output. But there is no system that connects what you observe in film to what gets worked on in practice to what actually improves in a player. Coaches make hundreds of observations every week. Almost none of them become development plans. Almost none of those plans produce measurable evidence of change. The gap between coaching and development is not a coaching problem. It is a systems problem.

The platform is the system that closes the gap.

### Homepage structure (recommended)

**Hero**: Not a feature list. A single sentence that describes the moment the platform was built for.

> "Film to focus area in three taps."  
> or  
> "From what you see on film to what they work on tomorrow."  
> or  
> "The only platform where coaching observations become development plans."

**Section 1 — The problem (two sentences)**: Coaches see everything. Development systems capture almost none of it.

**Section 2 — The loop (visual)**: Show the Film → Action → IDP → Practice → Assessment → Outcome chain. Not as a feature list. As a connected flow. This visual is the product.

**Section 3 — Evidence**: A parent seeing their child's development trajectory with a link to the film clip that triggered it. This is more emotionally compelling than any feature checklist.

**Section 4 — For the director**: Program health, coaching effectiveness, retention rates. The ROI argument. "Programs that can show development evidence retain 30% more players at re-enrollment." (This needs to be validated with real customer data — do not put a number on the homepage until it is true.)

**Section 5 — Simplicity of operations**: Billing, scheduling, communication handled so you can focus on development. Don't lead with this. Close with it.

### Sales motion

**Target buyer**: Club director or head coach who has felt the frustration of coaching hard and having nothing to show for it at the end of a season. Not a technology buyer. Not an ops buyer.

**The demo sequence** (in order):
1. Open a film session, annotate a defensive moment, create a coaching action in three taps
2. Show the player's dashboard — the action is visible, the assigned drill is there, the IDP focus area was updated
3. Show the parent digest — the parent sees "Coach Taylor identified a focus area for Marcus this week"
4. Show the assessment score after 6 weeks — the score went up; the coaching action is resolved
5. Show the program health dashboard to the director — 73% of coaching actions resolved, IDP coverage 80%, readiness completion 89%

The demo proves the loop. If the demo can't prove the loop because the platform isn't wired yet, do not attempt the enterprise sales motion. Run a design partner program with 3-5 programs where you manually synthesize the data while the product is being wired. Use those programs to validate the narrative before the product supports it.

---

## 7. The Product Loop That Creates Defensibility

### The flywheel (how it actually works)

```
Coach uploads film
  → annotates observation
    → creates coaching action (the wedge moment)
      → IDP focus area created with evidence
        → drill assigned to player
          → player completes assignment
            → coach assesses player on that skill
              → score improves
                → action resolved
                  → coach has a coaching record
                    → director sees coach effectiveness data
                      → parent sees development trajectory
                        → player re-enrolls (retention event)
                          → coach uploads next season's film
                            → [loop repeats]
```

Each iteration of this loop deposits data into the system that makes the next iteration more valuable and makes leaving more costly.

### The four compounding switching costs

**Cost 1 — The development record**. The IDP history, assessment trajectory, coaching action archive, and film annotation library for every player in the program. This is the irreplaceable artifact. After two seasons, a player's development record is genuinely unique — it is not a portfolio they assembled themselves (which colleges and future employers dismiss), but a record assembled by coaches with evidence attached. It cannot be exported to any other platform without losing the evidence links.

**Cost 2 — The coaching methodology record**. The director can see how many coaching actions Coach Martinez has created, resolved, and linked to IDP improvements. This data starts to mean something after 90 days. After two seasons, it is a longitudinal record of coaching activity that informs hiring, assignment, and development decisions. No other tool produces this record.

**Cost 3 — Parent relationship infrastructure**. Once parents are receiving weekly development digests and paying invoices through the platform, their primary relationship with the program runs through HoopsIQ. Migrating to a different platform means telling parents "please download a new app and re-enter your payment information." Programs are unwilling to do this mid-season and reluctant to do it at any time when parents are happy.

**Cost 4 — The program's own operational memory**. Two seasons of event history, billing records, registration forms, signed waivers, and attendance data. Migrating this is possible but painful. It is not the primary switching cost — it is the friction cost that compounds the others.

### Why the flywheel breaks

The flywheel breaks in exactly one place: **if coaches don't use the film annotation and coaching action features consistently.**

Everything else in the flywheel is downstream of that single behavior. If coaches upload film but don't annotate it, there are no coaching actions. If there are no coaching actions, there are no IDP updates. If IDPs don't update, parents see nothing. If parents see nothing, the development digest is empty. If the digest is empty, parent retention doesn't improve. If parent retention doesn't improve, the director doesn't see re-enrollment impact. If the director doesn't see impact, they don't renew.

**This is the product risk that dwarfs all technical risks.** The question is not whether the server architecture can handle film upload at scale. The question is whether coaches will open the app after they get home from a game at 9pm and annotate what they saw.

The answer requires two things that are not engineering problems:

**Answer 1 — The friction must be near zero.** The fastest path from "game ends" to "coaching action created" must be measurably faster than any alternative. If annotating film in this platform takes longer than texting yourself a note, coaches will text themselves a note.

**Answer 2 — The reward must be immediate and visible.** The coach must see a consequence of their annotation before the next practice. If a coach creates a coaching action and nothing visible happens for two weeks, they stop creating coaching actions. The consequence must be: the player gets notified, the IDP updates visibly, and the next time the coach opens the practice planner, the action is surfaced as a suggestion. All three of these consequences must happen within 12 hours of the annotation being created.

### Why this is defensible against well-funded competition

Hudl has more money and more film infrastructure. But they would have to rebuild their product from scratch to own this loop — their product has no IDP system, no assessment engine, no parent portal, and no practice planning tool. Adding these features doesn't create the loop; the loop requires them to be designed together from the beginning, with the coaching action as the bridge.

TeamSnap has more subscribers but zero coaching intelligence investment. They would have to hire a completely different product team and cannibalize their current "scheduling and billing" identity to enter this market.

The well-funded company most likely to compete is Hudl. The correct defensive move is to own the development record before they decide to build one. The development record requires two seasons of real data. The competitive window is approximately 18 months from now — after that, any well-funded competitor who decides to build this loop will take two years to get real longitudinal data, by which time HoopsIQ will have three seasons of development records and relationships with programs that are not willing to start over.

### The honest risk to the defensibility argument

The platform is not yet generating the data that creates the switching cost. The data model is correct. The data is not there yet. The defensibility is potential, not actual.

The implication: **speed is the product strategy**. Every week the product isn't wired and in use by real programs is a week without real data. Every week without real data is a week where the switching cost doesn't compound. The engineering roadmap is not just a product delivery plan — it is a competitive moat-building schedule.

Get 10 programs generating real coaching action data within the next 90 days. That is the product strategy. Everything else is a consequence.

---

## Summary: The Strategic Bets

| Bet | Confidence | Why |
|---|---|---|
| The observation-triggered development wedge is the right entry point | High | No competitor has it; coaches recognize the problem immediately |
| Basketball is the right first market | High | Domain-specific; weaker incumbents; visual and compelling |
| Engineering management is the right second market | Medium | Concepts transfer cleanly but timing must be right |
| The development record is the primary switching cost | High | Longitudinal data compounds; cannot be recreated elsewhere |
| Coaching adoption is the single biggest risk | Very high | Everything downstream depends on one behavior |
| AI film analysis is a Phase 3 feature | High | Premature in V1; expensive; trust-breaking if inaccurate |
| Certifications create no value before brand recognition exists | High | Build the credential after the brand, not before |
| The competitive window is 18 months | Medium | Hudl has resources; they haven't prioritized development |

### The one sentence that should drive every product decision

**If this feature doesn't make it more likely that a coach annotates film tonight, or that a player completes an assigned drill before tomorrow's practice, or that a parent understands their child's development better this week than last week — it is not a priority.**

---

*End of HoopsIQ Product Strategy Evaluation*
